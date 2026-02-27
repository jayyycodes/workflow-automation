/**
 * HTTP Request Handler
 * 
 * Generic HTTP request tool for calling any external API.
 * Features:
 * - Supports GET, POST, PUT, DELETE, PATCH, HEAD
 * - 25s timeout with retry logic (2 retries for transient failures)
 * - SSRF protection (blocks internal/private IPs)
 * - ContextMemory & executionLogger compatible
 */

import axios from 'axios';
import logger from '../../utils/logger.js';

// ─── SSRF Protection ───────────────────────────────────────────────────

const BLOCKED_HOSTS = [
    'localhost', '127.0.0.1', '0.0.0.0', '::1',
    'metadata.google.internal',       // GCP metadata
    'instance-data',                   // AWS metadata alias
];

const BLOCKED_IP_PREFIXES = [
    '10.',          // Private Class A
    '172.16.', '172.17.', '172.18.', '172.19.',
    '172.20.', '172.21.', '172.22.', '172.23.',
    '172.24.', '172.25.', '172.26.', '172.27.',
    '172.28.', '172.29.', '172.30.', '172.31.',   // Private Class B
    '192.168.',     // Private Class C
    '169.254.',     // Link-local
    'fe80:',        // IPv6 link-local
    'fc00:', 'fd00:' // IPv6 ULA
];

function isBlockedUrl(url) {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        // Block known internal hostnames
        if (BLOCKED_HOSTS.includes(hostname)) return true;

        // Block private IP ranges
        if (BLOCKED_IP_PREFIXES.some(prefix => hostname.startsWith(prefix))) return true;

        // Block AWS metadata endpoint
        if (hostname === '169.254.169.254') return true;

        // Block non-HTTP(S) protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) return true;

        return false;
    } catch {
        return true; // Invalid URL = blocked
    }
}

// ─── Retry Logic ────────────────────────────────────────────────────────

const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function isRetryable(error) {
    if (error.code && ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(error.code)) {
        return true;
    }
    if (error.response && RETRYABLE_STATUS_CODES.includes(error.response.status)) {
        return true;
    }
    return false;
}

// ─── Main Handler ───────────────────────────────────────────────────────

/**
 * Execute an HTTP request to an external API.
 * 
 * @param {Object} params
 * @param {string} params.method - HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD)
 * @param {string} params.url - Target URL
 * @param {Object} [params.headers] - Custom headers
 * @param {*} [params.body] - Request body (for POST/PUT/PATCH)
 * @param {number} [params.timeout] - Timeout in ms (default 25000, max 25000)
 * @param {Object} context - Execution context (ContextMemory, stepOutputs)
 * @returns {Object} Response data
 */
export const httpRequest = async (params, context) => {
    const {
        method = 'GET',
        url,
        headers = {},
        body,
        timeout = 25000
    } = params;

    // ── Validate inputs ──────────────────────────────────────────────
    if (!url) {
        throw new Error('http_request: "url" parameter is required');
    }

    const normalizedMethod = method.toUpperCase();
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
    if (!allowedMethods.includes(normalizedMethod)) {
        throw new Error(`http_request: Invalid method "${method}". Allowed: ${allowedMethods.join(', ')}`);
    }

    // ── SSRF protection ──────────────────────────────────────────────
    if (isBlockedUrl(url)) {
        throw new Error(`http_request: URL "${url}" is blocked (internal/private network addresses are not allowed)`);
    }

    // ── Enforce timeout cap ──────────────────────────────────────────
    const effectiveTimeout = Math.min(timeout, 25000);

    logger.info('🌐 HTTP Request', { method: normalizedMethod, url, timeout: effectiveTimeout });

    // ── Execute with retry ───────────────────────────────────────────
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            const delay = RETRY_DELAY_MS * attempt;
            logger.warn(`🔄 HTTP retry ${attempt}/${MAX_RETRIES} after ${delay}ms`, { url });
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        const startTime = Date.now();

        try {
            const config = {
                method: normalizedMethod,
                url,
                headers: {
                    'User-Agent': 'SmartWorkflow-Automation/1.0',
                    ...headers
                },
                timeout: effectiveTimeout,
                maxRedirects: 5,
                validateStatus: () => true // Don't throw on non-2xx — let caller decide
            };

            // Attach body for methods that support it
            if (['POST', 'PUT', 'PATCH'].includes(normalizedMethod) && body !== undefined) {
                config.data = body;
                // Auto-set Content-Type if not provided
                if (!config.headers['Content-Type'] && !config.headers['content-type']) {
                    config.headers['Content-Type'] = typeof body === 'object'
                        ? 'application/json'
                        : 'text/plain';
                }
            }

            const response = await axios(config);
            const duration = Date.now() - startTime;

            // Truncate large response bodies for ContextMemory safety
            let responseData = response.data;
            if (typeof responseData === 'string' && responseData.length > 50000) {
                responseData = responseData.substring(0, 50000) + '\n... [truncated]';
            }

            const result = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(
                    Object.entries(response.headers || {}).filter(([k]) =>
                        ['content-type', 'content-length', 'x-ratelimit-remaining', 'retry-after', 'location'].includes(k.toLowerCase())
                    )
                ),
                data: responseData,
                url,
                method: normalizedMethod,
                duration_ms: duration,
                timestamp: new Date().toISOString()
            };

            logger.info('✅ HTTP response', {
                status: response.status,
                duration_ms: duration,
                url
            });

            return result;

        } catch (error) {
            const duration = Date.now() - startTime;
            lastError = error;

            if (attempt < MAX_RETRIES && isRetryable(error)) {
                logger.warn(`⚠️ HTTP request failed (retryable)`, {
                    attempt: attempt + 1,
                    error: error.message,
                    code: error.code,
                    url,
                    duration_ms: duration
                });
                continue;
            }

            // Non-retryable or final attempt
            logger.error('❌ HTTP request failed', {
                error: error.message,
                code: error.code,
                url,
                method: normalizedMethod,
                duration_ms: duration,
                attempts: attempt + 1
            });
            break;
        }
    }

    // All retries exhausted
    throw new Error(
        `http_request failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message || 'Unknown error'}`
    );
};

export default httpRequest;
