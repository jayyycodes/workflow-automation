import { db } from '../config/firebase.js';
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
            const userId = req.user.id; // User ID from auth middleware

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

            const newAutomation = {
                user_id: userId,
                name,
                description: description || null,
                trigger,
                steps,
                status: AUTOMATION_STATUS.DRAFT,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const docRef = await db.collection('automations').add(newAutomation);
            const automation = { id: docRef.id, ...newAutomation };

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

            const docRef = db.collection('automations').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Automation not found'
                });
            }

            const automationData = doc.data();

            // Security: Check ownership
            if (automationData.user_id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this automation'
                });
            }

            const previousStatus = automationData.status;

            // Update status in Firestore
            await docRef.update({
                status: status,
                updated_at: new Date().toISOString()
            });

            const updated = { id, ...automationData, status, updated_at: new Date().toISOString() };

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

                await docRef.update({ status: previousStatus });

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

            const snapshot = await db.collection('automations')
                .where('user_id', '==', userId)
                .get(); // Firestore doesn't support order by desc on basic queries without index usually, but for small sets it's ok. 
            // To sort by created_at desc, we might need a composite index. 
            // For now, let's sort in memory if needed or rely on client.
            // Actually, let's sort in memory to avoid index creation delay.

            const automations = [];
            snapshot.forEach(doc => {
                automations.push({ id: doc.id, ...doc.data() });
            });

            // Sort by created_at desc
            automations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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

            const docRef = db.collection('automations').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Automation not found'
                });
            }

            const automationData = doc.data();
            const automation = { id: doc.id, ...automationData };

            // Security: Check ownership
            if (automation.user_id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this automation'
                });
            }

            // Create execution record
            const newExecution = {
                automationId: automation.id,
                input: input || null,
                status: 'PENDING',
                created_at: new Date().toISOString()
            };

            const execRef = await db.collection('executions').add(newExecution);
            const executionId = execRef.id;

            logger.info('Automation run triggered', {
                automationId: automation.id,
                executionId: executionId,
                userId
            });

            // Execute the workflow with user context
            const result = await executeWorkflow(automation, executionId, req.user);

            // Access to result.status is important here. It should be updated by executeWorkflow implicitly or explicitly. 
            // The executeWorkflow typically updates the DB. We return what it sends back.

            res.json({
                message: result.success ? 'Automation executed successfully' : 'Automation execution failed',
                execution_id: executionId,
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

            const docRef = db.collection('automations').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Automation not found'
                });
            }

            const automationData = doc.data();

            // Security: Check ownership
            if (automationData.user_id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this automation'
                });
            }

            // Get executions
            const snapshot = await db.collection('executions')
                .where('automationId', '==', id)
                .get();

            const executions = [];
            snapshot.forEach(doc => {
                executions.push({ id: doc.id, ...doc.data() });
            });

            // Sort by created_at desc
            executions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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

            const docRef = db.collection('automations').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Automation not found'
                });
            }

            const automation = { id: doc.id, ...doc.data() };

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

            const docRef = db.collection('automations').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Automation not found'
                });
            }

            const automationData = doc.data();

            // Security: Check ownership
            if (automationData.user_id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this automation'
                });
            }

            await docRef.delete();

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

