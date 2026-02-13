/**
 * MCP Server Factory
 * 
 * Creates a fully configured MCP server instance using the low-level Server API.
 * Uses raw JSON Schema from toolRegistry (no Zod conversion needed).
 * 
 * Design:
 * - Tool definitions are pre-loaded once at startup via toolRegistry
 * - createMcpServer() wires pre-computed handlers into a fresh Server instance
 * - Each HTTP request gets its own Server+Transport (MCP SDK requirement for stateless mode)
 * - The per-request cost is minimal — just handler registration, no I/O
 * 
 * Integrations:
 * - ContextMemory: Each tool call gets its own execution context
 * - executionLogger: State transitions and step results are logged to Firebase
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    ListToolsRequestSchema,
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { getMCPToolList, executeMCPToolWithContext, getMCPResourceList, readMCPResource } from '../registry/mcpToolAdapter.js';
import toolRegistry from '../registry/toolRegistry.js';
import logger from '../utils/logger.js';

// ─── Server Metadata ───────────────────────────────────────────────────

const SERVER_NAME = 'workflow-automation-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2025-03-26';

// ─── Pre-computed Tool Cache ────────────────────────────────────────────

let _toolCache = null;

/**
 * Pre-compute MCP tool list at startup.
 * Called once from index.js after toolRegistry is initialized.
 */
export function warmupMcpCache() {
    _toolCache = getMCPToolList();
    const toolCount = _toolCache.tools?.length || 0;
    logger.info(`🔌 MCP cache warmed: ${toolCount} tools ready for discovery`);
    return toolCount;
}

/**
 * Get cached tool list (falls back to live query if cache not warmed)
 */
function getCachedToolList() {
    if (!_toolCache) {
        _toolCache = getMCPToolList();
    }
    return _toolCache;
}

/**
 * Invalidate tool cache (call when registry changes)
 */
export function invalidateMcpCache() {
    _toolCache = null;
    logger.info('MCP tool cache invalidated');
}

// ─── Server Factory ─────────────────────────────────────────────────────

/**
 * Create a fully configured MCP Server instance.
 * 
 * Uses the low-level Server API to avoid JSON Schema → Zod conversion.
 * Our toolDefinitions.json already has JSON Schema — no need to convert.
 * 
 * Each request in stateless mode requires its own Server+Transport pair.
 * This is an MCP SDK design constraint, not a performance issue — the
 * per-request cost is just handler function registration (no I/O).
 * 
 * @returns {Server} Configured MCP Server ready for transport connection
 */
export function createMcpServer() {
    const server = new Server(
        {
            name: SERVER_NAME,
            version: SERVER_VERSION
        },
        {
            capabilities: {
                tools: {},
                resources: {}
            }
        }
    );

    // ── ListTools ────────────────────────────────────────────────────
    // Returns all MCP-exposable tools from registry with JSON Schema
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        logger.debug('MCP: tools/list requested');
        return getCachedToolList();
    });

    // ── CallTool ─────────────────────────────────────────────────────
    // Executes a tool with ContextMemory and executionLogger integration
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const toolName = request.params?.name || 'unknown';
        logger.info(`MCP: tools/call → ${toolName}`, {
            args: Object.keys(request.params?.arguments || {})
        });
        return await executeMCPToolWithContext(request);
    });

    // ── ListResources ────────────────────────────────────────────────
    // Exposes registry data as MCP resources
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        logger.debug('MCP: resources/list requested');
        return getMCPResourceList();
    });

    // ── ReadResource ─────────────────────────────────────────────────
    // Returns registry data for a specific resource URI
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const uri = request.params?.uri || '';
        logger.debug(`MCP: resources/read → ${uri}`);
        return await readMCPResource(request);
    });

    return server;
}

/**
 * Get MCP server status info for health checks
 */
export function getMcpServerInfo() {
    const registryInfo = toolRegistry.getRegistryInfo();
    return {
        name: SERVER_NAME,
        version: SERVER_VERSION,
        protocolVersion: PROTOCOL_VERSION,
        transport: 'streamable-http',
        mode: 'stateless',
        toolCount: registryInfo.mcpExposableCount,
        endpoint: '/mcp'
    };
}

export default {
    createMcpServer,
    warmupMcpCache,
    invalidateMcpCache,
    getMcpServerInfo
};
