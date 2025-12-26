import Automation from '../models/Automation.js';
import Execution from '../models/Execution.js';
import { executeWorkflow } from '../automations/workflowExecutor.js';
import { AUTOMATION_STATUS } from '../utils/constants.js';
import logger from '../utils/logger.js';

/**
 * Automation controller for CRUD and execution
 */
const automationController = {
    /**
     * Create a new automation
     * POST /automations
     */
    create: async (req, res, next) => {
        try {
            const { name, description, trigger, steps, status } = req.body;
            const userId = req.user.id;

            // Validate required fields
            if (!name) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Automation name is required'
                });
            }

            if (!trigger || typeof trigger !== 'object') {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Trigger configuration is required and must be an object'
                });
            }

            if (!steps || !Array.isArray(steps) || steps.length === 0) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Steps must be a non-empty array'
                });
            }

            // Validate status if provided
            if (status && !Object.values(AUTOMATION_STATUS).includes(status)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: `Invalid status. Must be one of: ${Object.values(AUTOMATION_STATUS).join(', ')}`
                });
            }

            // Create automation - always as DRAFT (ignore status from request)
            const automation = await Automation.create({
                userId,
                name,
                description,
                trigger,
                steps
                // Status will default to DRAFT in model
            });

            logger.info('Automation created', {
                automationId: automation.id,
                userId,
                name
            });

            res.status(201).json({
                message: 'Automation created successfully',
                automation
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * Update automation status
     * PATCH /automations/:id/status
     */
    updateStatus: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.user.id;

            // Find automation
            const automation = await Automation.findById(id);

            if (!automation) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Automation not found'
                });
            }

            // Security: Check ownership
            if (automation.user_id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this automation'
                });
            }

            const previousStatus = automation.status;

            // Update status in database
            const updated = await Automation.updateStatus(id, status);

            // Try to update scheduler - if this fails, rollback
            try {
                const { handleStatusChange } = await import('../scheduler/scheduler.js');
                await handleStatusChange(updated, status);
            } catch (schedulerError) {
                // Rollback database change if scheduler fails
                logger.error('Scheduler update failed, rolling back status change', {
                    automationId: id,
                    error: schedulerError.message
                });

                await Automation.updateStatus(id, previousStatus);

                return res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Failed to update automation status. Please try again.'
                });
            }

            logger.info('Automation status updated', {
                automationId: id,
                userId,
                status,
                previousStatus
            });

            res.json({
                message: 'Status updated successfully',
                automation: updated
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * List all automations for the authenticated user
     * GET /automations
     */
    list: async (req, res, next) => {
        try {
            const userId = req.user.id;

            const automations = await Automation.findByUserId(userId);

            logger.debug('Automations listed', { userId, count: automations.length });

            res.json({
                automations,
                count: automations.length
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * Manually run an automation
     * POST /automations/:id/run
     */
    run: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { input } = req.body;
            const userId = req.user.id;

            // Find automation
            const automation = await Automation.findById(id);

            if (!automation) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Automation not found'
                });
            }

            // Security: Check ownership
            if (automation.user_id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this automation'
                });
            }

            // Create execution record (status = PENDING initially, then RUNNING)
            const execution = await Execution.create({
                automationId: automation.id,
                input: input || null
            });

            logger.info('Automation run triggered', {
                automationId: automation.id,
                executionId: execution.id,
                userId
            });

            // Debug: Log user object to verify whatsapp number is loaded
            logger.info('User context for execution:', {
                userId: req.user.id,
                email: req.user.email,
                hasWhatsAppNumber: !!req.user.whatsapp_number,
                whatsappNumber: req.user.whatsapp_number
            });

            // Execute the workflow with user context
            const result = await executeWorkflow(automation, execution.id, req.user);

            res.json({
                message: result.success ? 'Automation executed successfully' : 'Automation execution failed',
                execution_id: execution.id,
                status: result.status,
                steps: result.steps,
                duration: result.duration,
                error: result.error || null
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * Get execution history for automation
     * GET /automations/:id/executions
     */
    getExecutions: async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Find automation
            const automation = await Automation.findById(id);

            if (!automation) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Automation not found'
                });
            }

            // Security: Check ownership
            if (automation.user_id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this automation'
                });
            }

            // Get executions
            const executions = await Execution.findByAutomationId(id);

            logger.debug('Executions fetched', {
                automationId: id,
                count: executions.length
            });

            res.json(executions);

        } catch (error) {
            next(error);
        }
    },

    /**
     * Get automation by ID
     * GET /automations/:id
     */
    getById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const automation = await Automation.findById(id);

            if (!automation) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Automation not found'
                });
            }

            // Security: Check ownership
            if (automation.user_id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this automation'
                });
            }

            res.json({ automation });

        } catch (error) {
            next(error);
        }
    },

    /**
     * Delete automation by ID
     * DELETE /automations/:id
     */
    delete: async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const automation = await Automation.findById(id);

            if (!automation) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Automation not found'
                });
            }

            // Security: Check ownership
            if (automation.user_id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this automation'
                });
            }

            await Automation.delete(id);

            logger.info('Automation deleted', { automationId: id, userId });

            res.json({
                message: 'Automation deleted successfully',
                id
            });

        } catch (error) {
            next(error);
        }
    }
};

export default automationController;
