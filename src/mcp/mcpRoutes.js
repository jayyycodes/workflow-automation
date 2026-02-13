/**
 * MCP Routes — Streamable HTTP Transport
 * 
 * Express router handling the MCP protocol endpoint at /mcp.
 * Uses stateless Streamable HTTP transport (Render-compatible).
 * 
 * Endpoints:
 *   POST /mcp  — JSON-RPC requests (initialize, tools/list, tools/call, etc.)
 *   GET  /mcp  — 405 (SSE not supported in stateless mode)
 *   DELETE /mcp — 405 (no session management in stateless mode)
 * 
 * Each POST creates a fresh Server+Transport pair (MCP SDK requirement).
 * Tool definitions and handlers are pre-loaded at startup via toolRegistry.
 */

import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './mcpServer.js';
import logger from '../utils/logger.js';

const router = Router();

// Render free tier timeout: 30s. Use 25s for safety margin.
const MCP_REQUEST_TIMEOUT_MS = parseInt(process.env.MCP_TIMEOUT_MS || '25000', 10);

/**
 * POST /mcp — Handle MCP JSON-RPC requests
 * 
 * Supports all standard MCP methods:
 *   - initialize (client handshake)
 *   - tools/list (discover available tools)
 *   - tools/call (execute a tool)
 *   - resources/list (discover available resources)
 *   - resources/read (read resource content)
 *   - notifications/initialized (client ready notification)
 */
router.post('/', async (req, res) => {
    const requestId = req.body?.id || null;
    const method = req.body?.method || 'unknown';

    logger.debug(`MCP POST: method=${method}, id=${requestId}`);

    // Create fresh server + transport per request (stateless pattern)
    const server = createMcpServer();
    let transport = null;
    let timeoutHandle = null;

    // Timeout protection for Render deployment
    timeoutHandle = setTimeout(() => {
        logger.warn(`MCP request timeout: method=${method}, id=${requestId}`);
        if (!res.headersSent) {
            res.status(504).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: `Request timeout after ${MCP_REQUEST_TIMEOUT_MS}ms`
                },
                id: requestId
            });
        }
        // Clean up
        if (transport) transport.close();
        server.close();
    }, MCP_REQUEST_TIMEOUT_MS);

    try {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined // Stateless — no session tracking
        });

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);

        // Clean up when connection closes
        res.on('close', () => {
            clearTimeout(timeoutHandle);
            transport.close();
            server.close();
        });

    } catch (error) {
        clearTimeout(timeoutHandle);
        logger.error('MCP request error:', {
            method,
            error: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join(' | ')
        });

        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: requestId
            });
        }
    }
});

/**
 * GET /mcp — SSE stream endpoint
 * Not supported in stateless mode (no persistent connections)
 */
router.get('/', (req, res) => {
    logger.debug('MCP GET: rejected (stateless mode)');
    res.status(405).json({
        jsonrpc: '2.0',
        error: {
            code: -32000,
            message: 'Method not allowed. This MCP server runs in stateless mode. Use POST for requests.'
        },
        id: null
    });
});

/**
 * DELETE /mcp — Session termination
 * Not supported in stateless mode (no sessions)
 */
router.delete('/', (req, res) => {
    logger.debug('MCP DELETE: rejected (stateless mode)');
    res.status(405).json({
        jsonrpc: '2.0',
        error: {
            code: -32000,
            message: 'Method not allowed. This MCP server runs in stateless mode (no sessions).'
        },
        id: null
    });
});

export default router;
