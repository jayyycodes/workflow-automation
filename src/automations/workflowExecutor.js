/**
 * Workflow Executor
 * 
 * Executes automation steps sequentially and tracks execution status.
 * 
 * Lifecycle: PENDING → RUNNING → SUCCESS | FAILED
 */

import { db } from '../config/firebase.js';
import stepRegistry, { isStepSupported, getStepHandler } from './stepRegistry.js';
import { EXECUTION_STATUS } from '../utils/constants.js';
import logger from '../utils/logger.js';

/**
 * Recursively remove undefined values from an object
 * Firestore doesn't allow undefined values, so we clean them before saving
 */
const removeUndefined = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
    }
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const cleanValue = removeUndefined(value);
        if (cleanValue !== undefined) {
            acc[key] = cleanValue;
        }
        return acc;
    }, {});
};

/**
 * Execute a workflow automation
 * 
 * @param {Object} automation - The automation object with steps
 * @param {string} executionId - The execution record ID
 * @param {Object} user - The user object (id, email, name)
 * @returns {Promise<Object>} Execution result with step outputs
 */
export const executeWorkflow = async (automation, executionId, user = null) => {
    const startTime = Date.now();
    const stepResults = [];

    logger.info('Starting workflow execution', {
        executionId,
        automationId: automation.id,
        automationName: automation.name,
        stepCount: automation.steps.length,
        userId: user?.id
    });

    // Build execution context - will contain outputs from previous steps
    const context = {
        automation,
        executionId,
        user: user || {}, // Include user info for personalized notifications
        startTime: new Date().toISOString(),
        stepOutputs: {}
    };

    try {
        // Get steps from automation (handle both parsed and stringified JSON)
        const steps = typeof automation.steps === 'string'
            ? JSON.parse(automation.steps)
            : automation.steps;

        // Execute each step sequentially
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepNumber = i + 1;

            logger.info(`Executing step ${stepNumber}/${steps.length}`, {
                executionId,
                stepType: step.type
            });

            // Check if step type is supported
            if (!isStepSupported(step.type)) {
                throw new Error(`Unsupported step type: ${step.type}`);
            }

            // Get step handler
            const handler = getStepHandler(step.type);

            // Execute step
            const stepStartTime = Date.now();
            const output = await handler(step, context);
            const stepDuration = Date.now() - stepStartTime;

            // Store step result
            const stepResult = {
                step: stepNumber,
                type: step.type,
                output,
                duration: stepDuration
            };
            stepResults.push(stepResult);

            // Add output to context for next steps
            context.stepOutputs[`step_${stepNumber}`] = output;
            if (step.outputAs) {
                context.stepOutputs[step.outputAs] = output;
            }

            logger.debug(`Step ${stepNumber} completed`, {
                executionId,
                stepType: step.type,
                duration: stepDuration
            });
        }

        // All steps completed successfully
        const totalDuration = Date.now() - startTime;

        logger.info('Workflow execution completed', {
            executionId,
            status: 'success',
            duration: totalDuration
        });

        // Update execution record with success
        await db.collection('executions').doc(executionId).update({
            status: EXECUTION_STATUS.SUCCESS,
            result: removeUndefined({
                steps: stepResults,
                duration: totalDuration,
                completedAt: new Date().toISOString()
            })
        });

        return {
            success: true,
            executionId,
            status: EXECUTION_STATUS.SUCCESS,
            steps: stepResults,
            duration: totalDuration
        };

    } catch (error) {
        const totalDuration = Date.now() - startTime;

        logger.error('Workflow execution failed', {
            executionId,
            error: error.message,
            duration: totalDuration
        });

        // Update execution record with failure
        await db.collection('executions').doc(executionId).update({
            status: EXECUTION_STATUS.FAILED,
            error: error.message,
            result: removeUndefined({
                steps: stepResults,
                failedAt: new Date().toISOString(),
                duration: totalDuration
            })
        });

        return {
            success: false,
            executionId,
            status: EXECUTION_STATUS.FAILED,
            steps: stepResults,
            error: error.message,
            duration: totalDuration
        };
    }
};

export default { executeWorkflow };
