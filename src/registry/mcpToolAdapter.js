/**
 * MCP Tool Adapter
 * 
 * Converts tool registry definitions into Model Context Protocol format.
 * Bridges existing tools to MCP server for both REST and Streamable HTTP usage.
 * 
 * Provides:
 * - getMCPToolList()           — ListToolsResponse for MCP
 * - executeMCPTool()           — Basic tool execution (backward compat)
 * - executeMCPToolWithContext() — Tool execution with ContextMemory + executionLogger
 * - getMCPResourceList()       — Available MCP resources
 * - readMCPResource()          — Read a specific MCP resource
 */

import toolRegistry from './toolRegistry.js';
import logger from '../utils/logger.js';
import { ContextMemory, logStateTransition, logStepResult } from '../utils/executionLogger.js';

/**
 * Get tool list in MCP ListToolsResponse format
 */
export function getMCPToolList() {
    const mcpTools = toolRegistry.getMCPTools();
    return {
        tools: mcpTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
        }))
    };
}

/**
 * Execute a tool via MCP CallToolRequest format.
 * Basic execution without ContextMemory (backward compatible).
 * 
 * @param {Object} request - MCP CallToolRequest
 * @param {string} request.params.name - Tool name
 * @param {Object} request.params.arguments - Tool arguments
 * @param {Object} context - Execution context (user, stepOutputs, etc.)
 * @returns {Object} MCP CallToolResponse
 */
export async function executeMCPTool(request, context = {}) {
    const { name, arguments: args } = request.params;

    const handler = toolRegistry.getToolHandler(name);
    if (!handler) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({ error: `Unknown tool: ${name}` })
            }],
            isError: true
        };
    }

    const def = toolRegistry.getToolDefinition(name);
    if (!def.mcpExposable) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({ error: `Tool '${name}' is not MCP-exposable` })
            }],
            isError: true
        };
    }

    try {
        logger.info(`MCP tool execution: ${name}`, { args });
        const result = await handler(args, context);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }],
            isError: false
        };
    } catch (error) {
        logger.error(`MCP tool execution failed: ${name}`, { error: error.message });
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    error: error.message,
                    tool: name
                })
            }],
            isError: true
        };
    }
}

/**
 * Execute a tool via MCP with full ContextMemory and executionLogger integration.
 * Used by the MCP server for production tool calls.
 * 
 * Flow:
 * 1. Create execution context with unique ID
 * 2. Log state transition: pending → running
 * 3. Execute tool via existing handler
 * 4. Log step result + context memory
 * 5. Log state transition: running → success/failed
 * 
 * @param {Object} request - MCP CallToolRequest
 * @returns {Object} MCP CallToolResponse
 */
export async function executeMCPToolWithContext(request) {
    const { name, arguments: args } = request.params;
    const executionId = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const contextMemory = new ContextMemory(executionId, 'mcp_invocation');
    const startTime = Date.now();

    try {
        // Log start
        await logStateTransition(executionId, 'pending', 'running', {
            tool: name,
            source: 'mcp',
            args: Object.keys(args || {})
        });

        // Build context for handler (backward-compatible with existing handlers)
        const context = contextMemory.buildStepContext();

        // Execute using basic adapter
        const result = await executeMCPTool(
            { params: { name, arguments: args } },
            context
        );

        const duration = Date.now() - startTime;

        // Parse result for logging
        let outputData = null;
        try {
            if (result.content?.[0]?.text) {
                outputData = JSON.parse(result.content[0].text);
            }
        } catch {
            outputData = result.content?.[0]?.text || null;
        }

        // Store in context memory
        contextMemory.storeStepOutput(0, name, outputData);

        // Log step result
        await logStepResult(executionId, 0, name, {
            duration_ms: duration,
            output: outputData,
            error: result.isError ? (outputData?.error || 'Unknown error') : null
        });

        // Log completion
        await logStateTransition(
            executionId,
            'running',
            result.isError ? 'failed' : 'success',
            { tool: name, duration_ms: duration }
        );

        // Persist context memory snapshot (fire-and-forget)
        contextMemory.persist().catch(err => {
            logger.warn('Failed to persist MCP context memory', { error: err.message });
        });

        return result;

    } catch (error) {
        const duration = Date.now() - startTime;

        // Log failure
        await logStateTransition(executionId, 'running', 'failed', {
            tool: name,
            error: error.message,
            duration_ms: duration
        });

        logger.error(`MCP tool execution failed with context: ${name}`, {
            executionId,
            error: error.message,
            duration_ms: duration
        });

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    error: error.message,
                    tool: name,
                    executionId
                })
            }],
            isError: true
        };
    }
}

/**
 * Get MCP resource list
 * Resources represent contextual data clients can read.
 */
export function getMCPResourceList() {
    return {
        resources: [
            {
                uri: 'workflow://registry/tools',
                mimeType: 'application/json',
                name: 'Available Tools',
                description: 'List of all automation tools with parameter schemas'
            },
            {
                uri: 'workflow://registry/categories',
                mimeType: 'application/json',
                name: 'Tool Categories',
                description: 'Tools grouped by category'
            },
            {
                uri: 'workflow://registry/info',
                mimeType: 'application/json',
                name: 'Registry Info',
                description: 'Registry metadata including version and statistics'
            }
        ]
    };
}

/**
 * Read a specific MCP resource by URI.
 * Returns resource content from the tool registry.
 * 
 * @param {Object} request - MCP ReadResourceRequest
 * @returns {Object} MCP ReadResourceResponse
 */
export async function readMCPResource(request) {
    const uri = request.params?.uri || '';

    if (uri === 'workflow://registry/tools') {
        return {
            contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(toolRegistry.getAllTools(), null, 2)
            }]
        };
    }

    if (uri === 'workflow://registry/categories') {
        return {
            contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(toolRegistry.getToolsByCategory(), null, 2)
            }]
        };
    }

    if (uri === 'workflow://registry/info') {
        return {
            contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(toolRegistry.getRegistryInfo(), null, 2)
            }]
        };
    }

    // Unknown resource
    logger.warn(`MCP resource not found: ${uri}`);
    return {
        contents: [{
            uri,
            mimeType: 'text/plain',
            text: `Resource not found: ${uri}`
        }]
    };
}

export default {
    getMCPToolList,
    executeMCPTool,
    executeMCPToolWithContext,
    getMCPResourceList,
    readMCPResource
};

