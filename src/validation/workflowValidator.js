/**
 * Workflow Validator
 * 
 * Registry-aware validation for AI-generated workflows.
 * Validates JSON structure, tool existence, required parameters,
 * and step ordering before execution.
 */

import { isToolRegistered, getToolDefinition, getAllToolNames } from '../registry/toolRegistry.js';
import logger from '../utils/logger.js';

class WorkflowValidator {
    /**
     * Validate a complete workflow object.
     * @param {Object} workflow - The automation workflow JSON
     * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
     */
    static validate(workflow) {
        const errors = [];
        const warnings = [];

        // 1. Top-level structure
        if (!workflow || typeof workflow !== 'object') {
            return { valid: false, errors: ['Workflow must be a JSON object'], warnings };
        }

        if (!workflow.name || typeof workflow.name !== 'string') {
            errors.push("Missing or invalid 'name' field (must be a non-empty string)");
        }

        if (!workflow.trigger || typeof workflow.trigger !== 'object') {
            errors.push("Missing or invalid 'trigger' field (must be an object)");
        }

        if (!workflow.steps || !Array.isArray(workflow.steps) || workflow.steps.length === 0) {
            errors.push("Missing or invalid 'steps' field (must be a non-empty array)");
        }

        // Short-circuit if structure is fundamentally broken
        if (errors.length > 0) {
            return { valid: false, errors, warnings };
        }

        // 2. Trigger validation
        const triggerResult = this.validateTrigger(workflow.trigger);
        errors.push(...triggerResult.errors);
        warnings.push(...triggerResult.warnings);

        // 3. Step validation
        for (let i = 0; i < workflow.steps.length; i++) {
            const stepResult = this.validateStep(workflow.steps[i], i + 1);
            errors.push(...stepResult.errors);
            warnings.push(...stepResult.warnings);
        }

        // 4. Step ordering check
        const orderResult = this.validateStepOrdering(workflow.steps);
        warnings.push(...orderResult.warnings);

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate trigger configuration
     */
    static validateTrigger(trigger) {
        const errors = [];
        const warnings = [];
        const ALLOWED_TRIGGERS = ['manual', 'interval', 'webhook', 'event'];

        if (!trigger.type) {
            errors.push("Trigger missing 'type' field");
            return { errors, warnings };
        }

        if (!ALLOWED_TRIGGERS.includes(trigger.type)) {
            errors.push(`Invalid trigger type: '${trigger.type}'. Allowed: ${ALLOWED_TRIGGERS.join(', ')}`);
        }

        if (trigger.type === 'interval') {
            if (!trigger.every) {
                errors.push("Interval trigger missing 'every' field");
            } else {
                const intervalPattern = /^\d{1,3}(s|m|h|d|w)$/;
                if (!intervalPattern.test(trigger.every.toLowerCase())) {
                    errors.push(`Invalid interval format: '${trigger.every}'. Use: 2m, 30s, 1h, 2d, 1w`);
                }
            }
        }

        return { errors, warnings };
    }

    /**
     * Validate a single step against the tool registry
     */
    static validateStep(step, stepNumber) {
        const errors = [];
        const warnings = [];
        const prefix = `Step ${stepNumber}`;

        if (!step || typeof step !== 'object') {
            errors.push(`${prefix}: Must be an object`);
            return { errors, warnings };
        }

        if (!step.type) {
            errors.push(`${prefix}: Missing 'type' field`);
            return { errors, warnings };
        }

        // Check tool existence in registry
        if (!isToolRegistered(step.type)) {
            const allNames = getAllToolNames();
            const suggestion = this.findClosestMatch(step.type, allNames);
            let msg = `${prefix}: Unknown tool type '${step.type}'`;
            if (suggestion) {
                msg += `. Did you mean '${suggestion}'?`;
            }
            errors.push(msg);
            return { errors, warnings };
        }

        // Check required parameters from registry
        const definition = getToolDefinition(step.type);
        if (definition && definition.parameters) {
            const required = definition.parameters.required || [];
            for (const param of required) {
                if (!(param in step) || step[param] === null || step[param] === undefined) {
                    errors.push(`${prefix}: Tool '${step.type}' requires parameter '${param}'`);
                }
            }

            // Warn about unknown parameters
            const knownParams = Object.keys(definition.parameters.properties || {});
            const stepParams = Object.keys(step).filter(k => k !== 'type');
            for (const param of stepParams) {
                if (knownParams.length > 0 && !knownParams.includes(param)) {
                    warnings.push(`${prefix}: Unknown parameter '${param}' for tool '${step.type}'`);
                }
            }
        }

        return { errors, warnings };
    }

    /**
     * Check if step ordering makes sense
     * (data producers should come before data consumers)
     */
    static validateStepOrdering(steps) {
        const warnings = [];
        const dataProducerTypes = [
            'fetch_stock_price', 'fetch_crypto_price', 'fetch_weather', 'fetch_data',
            'scrape_github', 'scrape_hackernews', 'scrape_reddit', 'scrape_screener',
            'scrape_groww', 'scrape_hack2skill', 'scrape_twitter', 'job_search', 'fetch_url'
        ];
        const dataConsumerTypes = [
            'send_email', 'send_whatsapp', 'send_sms', 'send_notification',
            'send_discord', 'send_slack', 'notify', 'format_web_digest'
        ];

        let hasProducer = false;
        for (let i = 0; i < steps.length; i++) {
            if (dataProducerTypes.includes(steps[i].type)) {
                hasProducer = true;
            }
            if (dataConsumerTypes.includes(steps[i].type) && !hasProducer && steps.length > 1) {
                warnings.push(
                    `Step ${i + 1}: Notification step '${steps[i].type}' appears before any data-fetching step`
                );
            }
        }

        return { warnings };
    }

    /**
     * Find closest matching tool name (for helpful error messages)
     */
    static findClosestMatch(input, candidates) {
        let best = null;
        let bestScore = Infinity;

        for (const candidate of candidates) {
            const dist = this.levenshteinDistance(input.toLowerCase(), candidate.toLowerCase());
            if (dist < bestScore && dist <= 3) {
                bestScore = dist;
                best = candidate;
            }
        }

        return best;
    }

    /**
     * Simple Levenshtein distance for fuzzy matching
     */
    static levenshteinDistance(a, b) {
        const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
            Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
        );

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[a.length][b.length];
    }
}

export default WorkflowValidator;
