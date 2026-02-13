/**
 * Registry Routes
 * 
 * Exposes tool registry via HTTP for:
 * - Python AI service to fetch allowed tools dynamically
 * - Future MCP clients to discover tools
 * - Debug/admin tool inspection
 */

import express from 'express';
import toolRegistry from '../registry/toolRegistry.js';

const router = express.Router();

/**
 * @route GET /registry/tools
 * @desc Get all tool definitions (for AI prompt generation and validation)
 * @access Public (internal service communication)
 */
router.get('/tools', (req, res) => {
    const tools = toolRegistry.getAllTools();
    res.json({
        registryVersion: toolRegistry.getRegistryInfo().version,
        tools
    });
});

/**
 * @route GET /registry/tools/:name
 * @desc Get a specific tool definition
 * @access Public
 */
router.get('/tools/:name', (req, res) => {
    const tool = toolRegistry.getToolDefinition(req.params.name);
    if (!tool) {
        return res.status(404).json({
            error: 'Not Found',
            message: `Tool '${req.params.name}' is not registered`
        });
    }
    const { handler, ...serializable } = tool;
    res.json(serializable);
});

/**
 * @route GET /registry/prompt
 * @desc Get tools formatted for AI prompt injection
 * @access Public (used by Python AI service)
 */
router.get('/prompt', (req, res) => {
    const promptText = toolRegistry.getToolsForPrompt();
    const toolNames = toolRegistry.getAllToolNames();
    res.json({
        promptText,
        toolNames,
        registryVersion: toolRegistry.getRegistryInfo().version
    });
});

/**
 * @route GET /registry/mcp
 * @desc Get MCP-compatible tool schemas
 * @access Public
 */
router.get('/mcp', (req, res) => {
    const mcpTools = toolRegistry.getMCPTools();
    res.json({
        tools: mcpTools,
        count: mcpTools.length
    });
});

/**
 * @route GET /registry/info
 * @desc Get registry metadata and stats
 * @access Public
 */
router.get('/info', (req, res) => {
    res.json(toolRegistry.getRegistryInfo());
});

export default router;
