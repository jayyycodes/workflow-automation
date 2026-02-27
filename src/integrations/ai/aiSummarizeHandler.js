/**
 * AI Summarization Handler
 * 
 * Summarizes text content using the Python AI service.
 * Features:
 * - Multiple output formats (bullets, paragraph, tldr)
 * - Graceful fallback if AI service is unavailable
 * - Input length cap to protect LLM context limits
 * - ContextMemory & executionLogger compatible
 */

import axios from 'axios';
import logger from '../../utils/logger.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const MAX_INPUT_LENGTH = 50000; // Characters
const REQUEST_TIMEOUT = 30000; // 30s

/**
 * Build a summarization prompt for the AI service.
 * 
 * @param {string} text - Input text to summarize
 * @param {string} format - Output format: bullets, paragraph, tldr
 * @param {number} maxLength - Approximate max output length
 * @returns {string} Formatted prompt
 */
function buildSummarizationPrompt(text, format = 'paragraph', maxLength = 500) {
    const formatInstructions = {
        bullets: `Summarize the following text as a concise bullet-point list (max ${maxLength} characters). Use "•" for bullet points. Focus on key facts, data points, and actionable insights.`,
        paragraph: `Write a clear, concise summary of the following text in ${Math.ceil(maxLength / 100)} sentences or fewer (max ${maxLength} characters). Focus on the most important information.`,
        tldr: `Provide a one-sentence TL;DR of the following text (max 200 characters). Be direct and specific.`
    };

    const instruction = formatInstructions[format] || formatInstructions.paragraph;

    return `${instruction}

TEXT TO SUMMARIZE:
---
${text}
---

Respond with ONLY the summary, no preamble or explanation.`;
}

/**
 * Summarize text using the Python AI service.
 * 
 * @param {Object} params
 * @param {string} params.text - Text content to summarize
 * @param {string} [params.format] - Output format: "bullets", "paragraph", "tldr" (default: "paragraph")
 * @param {number} [params.max_length] - Approximate max output length in characters (default: 500)
 * @param {Object} context - Execution context
 * @returns {Object} Summary result
 */
export const aiSummarize = async (params, context) => {
    let {
        text,
        format = 'paragraph',
        max_length = 500
    } = params;

    // ── Input Processing ─────────────────────────────────────────────

    // Handle array input (e.g. from RSS feed)
    if (Array.isArray(text)) {
        text = text.map(item => {
            if (typeof item === 'string') return item;
            if (item.title && item.link) return `${item.title} (${item.link})`;
            if (item.title) return item.title;
            return JSON.stringify(item);
        }).join('\n\n');
    }
    // Handle object input
    else if (typeof text === 'object' && text !== null) {
        text = JSON.stringify(text, null, 2);
    }

    if (!text || typeof text !== 'string') {
        throw new Error('ai_summarize: "text" parameter is required and must be a string');
    }

    const validFormats = ['bullets', 'paragraph', 'tldr'];
    const normalizedFormat = format.toLowerCase();
    if (!validFormats.includes(normalizedFormat)) {
        throw new Error(`ai_summarize: Invalid format "${format}". Allowed: ${validFormats.join(', ')}`);
    }

    // ── Truncate oversized input ─────────────────────────────────────
    let inputText = text;
    let truncated = false;
    if (inputText.length > MAX_INPUT_LENGTH) {
        inputText = inputText.substring(0, MAX_INPUT_LENGTH);
        truncated = true;
        logger.warn('📝 Input text truncated for summarization', {
            original: text.length,
            truncated: MAX_INPUT_LENGTH
        });
    }

    logger.info('🤖 AI Summarize', {
        inputLength: inputText.length,
        format: normalizedFormat,
        maxLength: max_length
    });

    const startTime = Date.now();

    try {
        // Build the prompt and call the Python AI service's /generate endpoint
        const prompt = buildSummarizationPrompt(inputText, normalizedFormat, max_length);

        const response = await axios.post(
            `${AI_SERVICE_URL}/generate`,
            {
                prompt: `Summarize this text: ${inputText.substring(0, 100)}...`,
                user_request: prompt
            },
            {
                timeout: REQUEST_TIMEOUT,
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const duration = Date.now() - startTime;

        // The /generate endpoint returns an automation JSON, but we need raw text.
        // Let's try the AI service with a direct LLM call approach.
        // If the response has a 'result' or 'automation' field, extract useful text.
        let summary = '';
        const data = response.data;

        if (typeof data === 'string') {
            summary = data;
        } else if (data?.automation?.description) {
            // /generate returns automation JSON — use description as fallback
            summary = data.automation.description;
        } else if (data?.result) {
            summary = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
        }

        // If /generate didn't give us a useful summary, do a direct summarization
        if (!summary || summary.length < 10) {
            summary = localSummarize(inputText, normalizedFormat, max_length);
        }

        if (!summary || summary.trim().length === 0) {
            throw new Error('AI returned empty summary');
        }

        const result = {
            summary,
            format: normalizedFormat,
            input_length: text.length,
            output_length: summary.length,
            truncated,
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };

        logger.info('✅ AI Summarize complete', {
            inputLength: text.length,
            outputLength: summary.length,
            summaryPreview: summary.substring(0, 100),
            duration_ms: duration
        });

        return result;

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.warn('⚠️ AI service unavailable, using local summarization', {
            error: error.message,
            duration_ms: duration
        });

        // Graceful fallback: local extractive summarization
        const summary = localSummarize(inputText, normalizedFormat, max_length);

        return {
            summary,
            format: normalizedFormat,
            input_length: text.length,
            output_length: summary.length,
            truncated,
            duration_ms: Date.now() - startTime,
            fallback: true,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Local extractive summarization fallback.
 * Picks the most information-dense sentences from the text.
 * Not as good as LLM summarization, but always available.
 */
function localSummarize(text, format, maxLength) {
    // Split into sentences
    const sentences = text
        .replace(/\n+/g, '. ')
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 20) // Drop very short fragments
        .map(s => s.trim());

    if (sentences.length === 0) {
        return text.substring(0, maxLength);
    }

    // Score sentences by: length, position (earlier = better), keyword density
    const scored = sentences.map((s, i) => ({
        text: s,
        score: (
            Math.min(s.length / 100, 1) * 0.3 +  // Length factor
            (1 - i / sentences.length) * 0.5 +     // Position factor (earlier = better)
            (s.match(/\d/g)?.length || 0) * 0.1 +  // Number density
            (s.match(/[A-Z][a-z]/g)?.length || 0) * 0.1 // Named entity proxy
        )
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Build summary within length limit
    const selected = [];
    let totalLength = 0;
    const limit = format === 'tldr' ? 200 : maxLength;

    for (const item of scored) {
        if (totalLength + item.text.length > limit) {
            if (selected.length === 0) {
                // At least include one sentence, truncated
                selected.push(item.text.substring(0, limit));
            }
            break;
        }
        selected.push(item.text);
        totalLength += item.text.length;
    }

    if (format === 'bullets') {
        return selected.map(s => `• ${s}`).join('\n');
    }

    if (format === 'tldr') {
        return selected[0] || text.substring(0, 200);
    }

    return selected.join(' ');
}

export default aiSummarize;
