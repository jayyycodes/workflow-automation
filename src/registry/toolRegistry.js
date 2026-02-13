/**
 * Tool Registry - Single Source of Truth
 * 
 * Centralized registry for all automation tools.
 * Consumed by: AI workflow generation, validator, executor, MCP adapter.
 * 
 * Design decisions:
 * - Definitions loaded from toolDefinitions.json (static, version-controlled)
 * - Handlers linked at runtime from existing stepRegistry.js
 * - MCP-compatible output via toMCPSchema()
 */

import { createRequire } from 'module';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);
const toolDefinitions = require('./toolDefinitions.json');

// Runtime handler map — populated by linkHandlers()
const handlers = new Map();

// Parsed tool definitions indexed by name
const toolMap = new Map();

// Initialize tool map from definitions
for (const tool of toolDefinitions.tools) {
    toolMap.set(tool.name, {
        ...tool,
        handler: null // Linked later
    });
}

/**
 * Link handler functions from stepRegistry into the tool registry.
 * Called once at startup after stepRegistry is imported.
 * 
 * @param {Object} stepRegistry - The step registry object from stepRegistry.js
 */
export function linkHandlers(stepRegistry) {
    let linked = 0;
    let missing = 0;

    for (const [name, def] of toolMap.entries()) {
        if (stepRegistry[name]) {
            def.handler = stepRegistry[name];
            handlers.set(name, stepRegistry[name]);
            linked++;
        } else {
            logger.warn(`Tool "${name}" has definition but no handler in stepRegistry`);
            missing++;
        }
    }

    // Check for handlers in stepRegistry that aren't in definitions
    for (const key of Object.keys(stepRegistry)) {
        if (!toolMap.has(key)) {
            logger.warn(`Handler "${key}" in stepRegistry has no tool definition — adding as unversioned`);
            toolMap.set(key, {
                name: key,
                version: '0.0.0',
                description: `Unregistered handler: ${key}`,
                category: 'unknown',
                mcpExposable: false,
                parameters: { type: 'object', properties: {}, required: [] },
                outputSchema: { type: 'object' },
                handler: stepRegistry[key]
            });
            handlers.set(key, stepRegistry[key]);
        }
    }

    logger.info(`Tool Registry initialized: ${linked} linked, ${missing} missing handlers, ${toolMap.size} total`);
}

/**
 * Get full tool definition by name
 */
export function getToolDefinition(name) {
    return toolMap.get(name) || null;
}

/**
 * Get handler function by name
 */
export function getToolHandler(name) {
    return handlers.get(name) || null;
}

/**
 * Check if a tool is registered
 */
export function isToolRegistered(name) {
    return toolMap.has(name);
}

/**
 * Get all tool definitions (without handlers, safe for serialization)
 */
export function getAllTools() {
    const tools = [];
    for (const [name, def] of toolMap.entries()) {
        const { handler, ...serializable } = def;
        tools.push(serializable);
    }
    return tools;
}

/**
 * Get all registered tool names
 */
export function getAllToolNames() {
    return Array.from(toolMap.keys());
}

/**
 * Generate a compact prompt-friendly string for AI consumption.
 * Lists each tool with name, description, and required params.
 */
export function getToolsForPrompt() {
    const lines = [];
    for (const [name, def] of toolMap.entries()) {
        const params = def.parameters?.properties || {};
        const required = def.parameters?.required || [];
        const paramList = Object.entries(params).map(([pName, pDef]) => {
            const req = required.includes(pName) ? ' (REQUIRED)' : '';
            return `    - ${pName}: ${pDef.description || pDef.type}${req}`;
        });

        lines.push(`- ${name}: ${def.description}`);
        if (paramList.length > 0) {
            lines.push(`  Parameters:`);
            lines.push(...paramList);
        }
    }
    return lines.join('\n');
}

/**
 * Get tools grouped by category
 */
export function getToolsByCategory() {
    const categories = {};
    for (const [name, def] of toolMap.entries()) {
        const cat = def.category || 'uncategorized';
        if (!categories[cat]) categories[cat] = [];
        const { handler, ...serializable } = def;
        categories[cat].push(serializable);
    }
    return categories;
}

/**
 * Convert a tool definition to MCP-compatible schema
 */
export function toMCPSchema(name) {
    const def = toolMap.get(name);
    if (!def) return null;

    return {
        name: def.name,
        description: def.description,
        inputSchema: def.parameters,
        // MCP tools don't have outputSchema in spec, but we include for documentation
        metadata: {
            version: def.version,
            category: def.category,
            mcpExposable: def.mcpExposable
        }
    };
}

/**
 * Get all MCP-exposable tool schemas
 */
export function getMCPTools() {
    const mcpTools = [];
    for (const [name, def] of toolMap.entries()) {
        if (def.mcpExposable) {
            mcpTools.push(toMCPSchema(name));
        }
    }
    return mcpTools;
}

/**
 * Get registry metadata
 */
export function getRegistryInfo() {
    return {
        version: toolDefinitions.registryVersion,
        lastUpdated: toolDefinitions.lastUpdated,
        totalTools: toolMap.size,
        linkedHandlers: handlers.size,
        categories: Object.keys(getToolsByCategory()),
        mcpExposableCount: Array.from(toolMap.values()).filter(t => t.mcpExposable).length
    };
}

export default {
    linkHandlers,
    getToolDefinition,
    getToolHandler,
    isToolRegistered,
    getAllTools,
    getAllToolNames,
    getToolsForPrompt,
    getToolsByCategory,
    toMCPSchema,
    getMCPTools,
    getRegistryInfo
};
