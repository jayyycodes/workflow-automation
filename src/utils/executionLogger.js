/**
 * Execution Logger & Context Memory Layer
 * 
 * Provides:
 * 1. Structured execution logging with state transitions
 * 2. Context memory for step output storage and cross-step data sharing
 * 3. Workflow version tracking in Firebase
 * 
 * This is the observability + memory backbone for the execution engine.
 */

import { db } from '../config/firebase.js';
import { EXECUTION_STATUS, WORKFLOW_VERSION } from './constants.js';
import logger from './logger.js';

/**
 * Remove undefined values from an object (Firestore doesn't accept undefined)
 */
function sanitizeForFirestore(obj) {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;

    // Handle Arrays
    if (Array.isArray(obj)) {
        // Check for nested arrays (Firestore doesn't support them)
        const hasNestedArray = obj.some(item => Array.isArray(item));
        if (hasNestedArray) {
            // Stringify the whole array if it contains nested arrays
            return JSON.stringify(obj);
        }
        return obj.map(sanitizeForFirestore);
    }

    // Handle Objects
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = typeof value === 'object' ? sanitizeForFirestore(value) : value;
        }
    }
    return cleaned;
}

// ─── Execution State Tracking ──────────────────────────────────────────

/**
 * Log a state transition for an execution
 */
export async function logStateTransition(executionId, fromState, toState, metadata = {}) {
    try {
        const transition = sanitizeForFirestore({
            from: fromState,
            to: toState,
            timestamp: new Date().toISOString(),
            ...metadata
        });

        await db.collection('executions').doc(executionId).collection('state_log').add(transition);

        logger.info(`State transition: ${fromState} → ${toState}`, {
            executionId,
            ...metadata
        });
    } catch (error) {
        logger.error('Failed to log state transition', {
            executionId,
            error: error.message
        });
    }
}

/**
 * Update execution status in Firebase with state logging
 */
export async function updateExecutionStatus(executionId, status, data = {}) {
    try {
        const update = sanitizeForFirestore({
            status,
            updated_at: new Date().toISOString(),
            ...data
        });

        await db.collection('executions').doc(executionId).update(update);
    } catch (error) {
        logger.error('Failed to update execution status', {
            executionId,
            status,
            error: error.message
        });
    }
}

/**
 * Log individual step result
 */
export async function logStepResult(executionId, stepIndex, stepType, result) {
    try {
        const stepLog = sanitizeForFirestore({
            step: stepIndex,
            type: stepType,
            duration_ms: result.duration_ms || 0,
            status: result.error ? 'failed' : 'success',
            output_summary: summarizeOutput(result.output),
            error: result.error || null,
            retries: result.retries || 0,
            timestamp: new Date().toISOString()
        });

        await db.collection('executions').doc(executionId).collection('step_logs').add(stepLog);
    } catch (error) {
        logger.error('Failed to log step result', {
            executionId,
            stepIndex,
            error: error.message
        });
    }
}

// ─── Context Memory Layer ──────────────────────────────────────────────

/**
 * Execution context memory — stores and provides step outputs
 * for cross-step data sharing during workflow execution.
 */
export class ContextMemory {
    constructor(executionId, automationId, user = null) {
        this.executionId = executionId;
        this.automationId = automationId;
        this.user = user;
        this.stepOutputs = {};
        this.metadata = {};
        this.startTime = new Date();
    }

    /**
     * Store output from a completed step
     */
    storeStepOutput(stepIndex, stepType, output) {
        const key = `step_${stepIndex + 1}`;
        this.stepOutputs[key] = output;

        // Also store by type for easier lookup
        if (!this.metadata.outputsByType) {
            this.metadata.outputsByType = {};
        }
        this.metadata.outputsByType[stepType] = output;

        logger.debug(`Context memory: stored output for ${key} (${stepType})`, {
            executionId: this.executionId,
            keys: Object.keys(output || {}).slice(0, 5)
        });
    }

    /**
     * Get output from a specific step
     */
    getStepOutput(stepIndex) {
        return this.stepOutputs[`step_${stepIndex + 1}`] || null;
    }

    /**
     * Get output by step type (finds the most recent)
     */
    getOutputByType(stepType) {
        return this.metadata.outputsByType?.[stepType] || null;
    }

    /**
     * Build the context object passed to step handlers.
     * Backward-compatible with existing handler signatures.
     */
    buildStepContext() {
        return {
            executionId: this.executionId,
            automationId: this.automationId,
            user: this.user,
            userId: this.user?.id || null,
            startTime: this.startTime.toISOString(),
            stepOutputs: { ...this.stepOutputs }
        };
    }

    /**
     * Get execution duration so far
     */
    getDuration() {
        return Date.now() - this.startTime.getTime();
    }

    /**
     * Persist the context memory to Firebase for debugging/analytics
     */
    async persist() {
        try {
            const snapshot = sanitizeForFirestore({
                executionId: this.executionId,
                automationId: this.automationId,
                stepOutputs: this.summarizeAllOutputs(),
                duration_ms: this.getDuration(),
                timestamp: new Date().toISOString()
            });

            await db.collection('executions').doc(this.executionId).update({
                context_snapshot: snapshot
            });
        } catch (error) {
            logger.error('Failed to persist context memory', {
                executionId: this.executionId,
                error: error.message
            });
        }
    }

    /**
     * Create concise summaries of all step outputs
     */
    summarizeAllOutputs() {
        const summaries = {};
        for (const [key, output] of Object.entries(this.stepOutputs)) {
            summaries[key] = summarizeOutput(output);
        }
        return summaries;
    }
}

// ─── Workflow Version Tracking ─────────────────────────────────────────

/**
 * Add version metadata to a workflow before saving to Firebase
 */
export function stampWorkflowVersion(workflow) {
    return {
        ...workflow,
        _version: WORKFLOW_VERSION,
        _versionedAt: new Date().toISOString()
    };
}

/**
 * Create a version history entry when workflow is modified
 */
export async function trackWorkflowVersion(automationId, workflow, changeType = 'update') {
    try {
        const versionEntry = sanitizeForFirestore({
            automationId,
            version: WORKFLOW_VERSION,
            changeType, // 'create', 'update', 'fixed_by_ai'
            workflow: {
                name: workflow.name,
                trigger: workflow.trigger,
                steps: workflow.steps,
                stepCount: workflow.steps?.length || 0
            },
            timestamp: new Date().toISOString()
        });

        await db.collection('automations').doc(automationId)
            .collection('version_history').add(versionEntry);

        logger.info(`Workflow version tracked: ${changeType}`, {
            automationId,
            version: WORKFLOW_VERSION
        });
    } catch (error) {
        logger.error('Failed to track workflow version', {
            automationId,
            error: error.message
        });
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Create a concise summary of any step output
 */
function summarizeOutput(output) {
    if (!output) return null;
    if (typeof output === 'string') return output.substring(0, 200);
    if (typeof output !== 'object') return String(output).substring(0, 200);

    // For arrays (e.g., scraped items), summarize length
    if (Array.isArray(output)) {
        return { type: 'array', count: output.length };
    }

    // For objects, capture key info without full content
    const summary = {};
    const keys = Object.keys(output);
    summary._keys = keys.slice(0, 8);
    summary._type = 'object';

    // Copy small scalar values, summarize large ones
    for (const key of keys.slice(0, 5)) {
        const val = output[key];
        if (val === null || val === undefined) {
            summary[key] = null;
        } else if (typeof val === 'string') {
            summary[key] = val.length > 100 ? val.substring(0, 100) + '...' : val;
        } else if (typeof val === 'number' || typeof val === 'boolean') {
            summary[key] = val;
        } else if (Array.isArray(val)) {
            summary[key] = `[Array: ${val.length} items]`;
        } else {
            summary[key] = '[Object]';
        }
    }

    return summary;
}

export default {
    logStateTransition,
    updateExecutionStatus,
    logStepResult,
    ContextMemory,
    stampWorkflowVersion,
    trackWorkflowVersion
};
