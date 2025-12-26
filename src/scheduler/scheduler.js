/**
 * Scheduler Module
 * 
 * Manages cron jobs for active automations.
 * - Loads active automations on startup
 * - Registers/unregisters cron jobs
 * - Executes workflows on trigger
 */

import cron from 'node-cron';
import Automation from '../models/Automation.js';
import Execution from '../models/Execution.js';
import { executeWorkflow } from '../automations/workflowExecutor.js';
import { triggerToCron, isSchedulable } from './triggerParser.js';
import { AUTOMATION_STATUS } from '../utils/constants.js';
import logger from '../utils/logger.js';

// Store active cron jobs: automationId -> cronTask
const cronJobs = new Map();

/**
 * Schedule a single automation
 * 
 * @param {Object} automation - Automation object
 * @returns {boolean} Whether scheduling was successful
 */
export const scheduleAutomation = (automation) => {
    const automationId = automation.id;

    // Parse trigger (handle JSON string or object)
    const trigger = typeof automation.trigger === 'string'
        ? JSON.parse(automation.trigger)
        : automation.trigger;

    // Check if schedulable
    if (!isSchedulable(trigger)) {
        logger.debug('Automation has manual trigger, not scheduling', { automationId });
        return false;
    }

    // Convert to cron expression
    const { valid, cron: cronExpression, error } = triggerToCron(trigger);

    if (!valid || !cronExpression) {
        logger.error('Failed to parse trigger', { automationId, trigger, error });
        return false;
    }

    // Remove existing job if any
    unscheduleAutomation(automationId);

    // Create cron job
    try {
        const task = cron.schedule(cronExpression, async () => {
            logger.info('⏰ Cron triggered', { automationId, name: automation.name });
            await runScheduledExecution(automation);
        });

        cronJobs.set(automationId, task);
        logger.info('✅ Automation scheduled', {
            automationId,
            name: automation.name,
            cron: cronExpression,
            trigger: trigger.type
        });

        return true;
    } catch (err) {
        logger.error('Failed to schedule automation', { automationId, error: err.message });
        return false;
    }
};

/**
 * Unschedule an automation
 * 
 * @param {number} automationId
 */
export const unscheduleAutomation = (automationId) => {
    if (cronJobs.has(automationId)) {
        const task = cronJobs.get(automationId);
        task.stop();
        cronJobs.delete(automationId);
        logger.info('🛑 Automation unscheduled', { automationId });
    }
};

/**
 * Run a scheduled execution
 * 
 * @param {Object} automation
 */
const runScheduledExecution = async (automation) => {
    try {
        // Create execution record
        const execution = await Execution.create({
            automationId: automation.id,
            input: { triggeredBy: 'scheduler', scheduledAt: new Date().toISOString() }
        });

        logger.info('📋 Scheduled execution started', {
            automationId: automation.id,
            executionId: execution.id
        });

        // Fetch user for personalized notifications
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(automation.user_id);

        // Execute workflow with user context
        const result = await executeWorkflow(automation, execution.id, user);

        logger.info('📋 Scheduled execution completed', {
            automationId: automation.id,
            executionId: execution.id,
            status: result.status
        });

    } catch (error) {
        logger.error('Scheduled execution failed', {
            automationId: automation.id,
            error: error.message
        });
    }
};

/**
 * Load and schedule all active automations
 * Called on server startup
 */
export const loadActiveAutomations = async () => {
    try {
        logger.info('🔄 Loading active automations for scheduling...');

        // Query all active automations
        const result = await Automation.findByStatus(AUTOMATION_STATUS.ACTIVE);
        const automations = result || [];

        logger.info(`Found ${automations.length} active automations`);

        let scheduled = 0;
        for (const automation of automations) {
            if (scheduleAutomation(automation)) {
                scheduled++;
            }
        }

        logger.info(`✅ Scheduler initialized: ${scheduled}/${automations.length} automations scheduled`);

    } catch (error) {
        logger.error('Failed to load active automations', { error: error.message });
    }
};

/**
 * Handle automation status change
 * 
 * @param {Object} automation
 * @param {string} newStatus
 */
export const handleStatusChange = async (automation, newStatus) => {
    if (newStatus === AUTOMATION_STATUS.ACTIVE) {
        // Schedule for future runs
        const scheduled = scheduleAutomation(automation);

        // Run immediately on activation (better UX)
        if (scheduled) {
            logger.info('🚀 Running automation immediately on activation', {
                automationId: automation.id,
                name: automation.name
            });

            // Run in background without blocking
            runScheduledExecution(automation).catch(err => {
                logger.error('Failed to run immediate execution', {
                    automationId: automation.id,
                    error: err.message
                });
            });
        }
    } else {
        unscheduleAutomation(automation.id);
    }
};

/**
 * Get scheduler statistics
 */
export const getSchedulerStats = () => {
    return {
        totalJobs: cronJobs.size,
        activeJobs: Array.from(cronJobs.keys())
    };
};

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
export const stopAll = () => {
    logger.info('Stopping all scheduled jobs...');

    for (const [automationId, job] of cronJobs.entries()) {
        job.stop();
        logger.debug('Stopped job', { automationId });
    }

    cronJobs.clear();
    logger.info(`Stopped ${cronJobs.size} scheduled jobs`);
};

export default {
    scheduleAutomation,
    unscheduleAutomation,
    loadActiveAutomations,
    handleStatusChange,
    getSchedulerStats,
    stopAll
};
