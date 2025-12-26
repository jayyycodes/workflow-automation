import express from 'express';
import automationController from '../controllers/automationController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All automation routes require authentication
router.use(authMiddleware);

/**
 * @route POST /automations
 * @desc Create a new automation
 * @access Private
 */
router.post('/', automationController.create);

/**
 * @route GET /automations
 * @desc List all automations for the authenticated user
 * @access Private
 */
router.get('/', automationController.list);

/**
 * @route GET /automations/:id
 * @desc Get automation by ID
 * @access Private
 */
router.get('/:id', automationController.getById);

/**
 * @route PATCH /automations/:id/status
 * @desc Update automation status
 * @access Private
 */
router.patch('/:id/status', automationController.updateStatus);

/**
 * @route GET /automations/:id/executions
 * @desc Get execution history for an automation
 * @access Private
 */
router.get('/:id/executions', automationController.getExecutions);

/**
 * @route POST /automations/:id/run
 * @desc Manually trigger automation execution
 * @access Private
 */
router.post('/:id/run', automationController.run);

/**
 * @route DELETE /automations/:id
 * @desc Delete an automation
 * @access Private
 */
router.delete('/:id', automationController.delete);

export default router;
