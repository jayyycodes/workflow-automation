/**
 * AI Bridge Service
 * 
 * Handles communication between Node.js backend and Python AI engine.
 * 
 * This service:
 * - Calls Python /parse-intent for text understanding
 * - Calls Python /generate-automation for JSON generation
 * - Does NOT contain any AI logic (Python handles that)
 */

import logger from '../utils/logger.js';

// Python AI service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * AI Bridge Service for Python communication
 */
const aiBridgeService = {
    /**
     * Parse user intent from natural language text
     * 
     * @param {string} text - User's natural language input
     * @returns {Promise<Object>} Parsed intent with entities
     */
    parseIntent: async (text) => {
        logger.info('Calling Python /parse-intent', { text });

        try {
            const response = await fetch(`${AI_SERVICE_URL}/parse-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error(`Python service error: ${response.status}`);
            }

            const result = await response.json();
            logger.debug('Intent parsed', result);
            return result;

        } catch (error) {
            logger.error('parseIntent failed', { error: error.message });
            return {
                success: false,
                error: `AI service unavailable: ${error.message}`
            };
        }
    },

    /**
     * Generate automation JSON from natural language text
     * 
     * @param {string} text - User's natural language input
     * @returns {Promise<Object>} Generated automation schema
     */
    generateAutomation: async (text) => {
        logger.info('Calling Python /generate-automation', { text });

        try {
            const response = await fetch(`${AI_SERVICE_URL}/generate-automation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error(`Python service error: ${response.status}`);
            }

            const result = await response.json();
            logger.debug('Automation generated', result);
            return result;

        } catch (error) {
            logger.error('generateAutomation failed', { error: error.message });
            return {
                success: false,
                error: `AI service unavailable: ${error.message}`
            };
        }
    },

    /**
     * Check if Python AI service is healthy
     * 
     * @returns {Promise<Object>} Health status
     */
    checkHealth: async () => {
        try {
            const response = await fetch(`${AI_SERVICE_URL}/health`);
            const data = await response.json();
            logger.info('Python AI service health', data);
            return {
                healthy: data.status === 'python service ready',
                ...data
            };
        } catch (error) {
            logger.error('Python AI service not reachable', { error: error.message });
            return {
                healthy: false,
                error: error.message
            };
        }
    },

    /**
     * Multi-turn conversation for automation creation
     * 
     * @param {string} text - User's input text
     * @param {string} inputMode - "voice" or "text"
     * @param {Object} context - Previous conversation context
     * @returns {Promise<Object>} Clarification or automation result
     */
    conversation: async (text, inputMode = 'text', context = null) => {
        logger.info('Calling Python /conversation', { text, inputMode });

        try {
            const response = await fetch(`${AI_SERVICE_URL}/conversation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    input_mode: inputMode,
                    context: context || {}
                })
            });

            if (!response.ok) {
                throw new Error(`Python service error: ${response.status}`);
            }

            const result = await response.json();
            logger.debug('Conversation response', result);
            return result;

        } catch (error) {
            logger.error('conversation failed', { error: error.message });
            return {
                success: false,
                error: `AI service unavailable: ${error.message}`,
                response_mode: inputMode,
                text: "I'm having trouble connecting. Please try again."
            };
        }
    }
};

export default aiBridgeService;

