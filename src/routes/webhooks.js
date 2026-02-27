/**
 * Webhook Routes
 * 
 * Receives external webhook payloads and triggers automations.
 * 
 * Design:
 * - Unauthenticated by design (external services can't pass Firebase auth)
 * - Validates automationId exists and has webhook trigger type
 * - Optional HMAC signature verification via x-webhook-secret header
 * - Injects payload into ContextMemory for workflow access
 * - Creates execution record in Firestore
 */

import express from 'express';
import crypto from 'crypto';
import { db } from '../config/firebase.js';
import { executeWorkflow } from '../automations/workflowExecutor.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /webhook/:automationId
 * 
 * Receives a webhook payload from an external service and triggers
 * the associated automation workflow.
 * 
 * Headers:
 *   x-webhook-secret (optional) - HMAC signature for payload verification
 * 
 * Body:
 *   Any JSON payload — injected into ContextMemory as webhookPayload
 */
router.post('/:automationId', async (req, res) => {
    const { automationId } = req.params;
    const payload = req.body || {};

    logger.info('🪝 Webhook received', {
        automationId,
        payloadKeys: Object.keys(payload),
        contentType: req.headers['content-type']
    });

    try {
        // ── 1. Load automation from Firestore ────────────────────────
        const automationDoc = await db.collection('automations').doc(automationId).get();

        if (!automationDoc.exists) {
            logger.warn('Webhook: automation not found', { automationId });
            return res.status(404).json({
                error: 'Automation not found',
                automationId
            });
        }

        const automation = { id: automationDoc.id, ...automationDoc.data() };

        // ── 2. Validate trigger type is webhook ──────────────────────
        const trigger = typeof automation.trigger === 'string'
            ? JSON.parse(automation.trigger)
            : automation.trigger;

        if (trigger?.type !== 'webhook') {
            logger.warn('Webhook: automation does not have webhook trigger', {
                automationId,
                triggerType: trigger?.type
            });
            return res.status(400).json({
                error: 'Automation does not have a webhook trigger',
                automationId,
                actualTriggerType: trigger?.type
            });
        }

        // ── 3. Optional HMAC signature verification ──────────────────
        const webhookSecret = trigger.secret || process.env.WEBHOOK_SECRET;
        const signatureHeader = req.headers['x-webhook-secret'] || req.headers['x-hub-signature-256'];

        if (webhookSecret && signatureHeader) {
            const rawBody = JSON.stringify(payload);
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');

            const providedSig = signatureHeader.replace('sha256=', '');

            if (!crypto.timingSafeEqual(
                Buffer.from(providedSig, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            )) {
                logger.warn('Webhook: HMAC signature mismatch', { automationId });
                return res.status(401).json({
                    error: 'Invalid webhook signature'
                });
            }

            logger.debug('Webhook: HMAC signature verified', { automationId });
        }

        // ── 4. Check automation status ───────────────────────────────
        if (automation.status !== 'ACTIVE') {
            logger.info('Webhook: automation is not active', {
                automationId,
                status: automation.status
            });
            return res.status(200).json({
                message: 'Automation is not active, webhook acknowledged but not executed',
                automationId,
                status: automation.status
            });
        }

        // ── 5. Create execution record ───────────────────────────────
        const executionData = {
            automationId,
            input: {
                triggeredBy: 'webhook',
                webhookPayload: payload,
                receivedAt: new Date().toISOString(),
                sourceIp: req.ip || req.connection?.remoteAddress,
                headers: {
                    'content-type': req.headers['content-type'],
                    'user-agent': req.headers['user-agent']
                }
            },
            status: 'PENDING',
            created_at: new Date().toISOString()
        };

        const execRef = await db.collection('executions').add(executionData);
        const executionId = execRef.id;

        logger.info('📋 Webhook execution created', {
            automationId,
            executionId
        });

        // ── 6. Fetch user for personalized notifications ─────────────
        let user = null;
        if (automation.user_id) {
            const userDoc = await db.collection('users').doc(automation.user_id).get();
            user = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
        }

        // ── 7. Execute workflow (async, don't block webhook response) ─
        // Respond to the webhook sender immediately, then execute in background
        res.status(200).json({
            message: 'Webhook received and workflow execution started',
            automationId,
            executionId,
            timestamp: new Date().toISOString()
        });

        // Execute workflow in background with webhook payload in context
        executeWorkflow(
            {
                ...automation,
                _webhookPayload: payload
            },
            executionId,
            user
        ).then(result => {
            logger.info('✅ Webhook-triggered execution completed', {
                automationId,
                executionId,
                status: result.status
            });
        }).catch(error => {
            logger.error('❌ Webhook-triggered execution failed', {
                automationId,
                executionId,
                error: error.message
            });
        });

    } catch (error) {
        logger.error('❌ Webhook processing error', {
            automationId,
            error: error.message
        });

        // If we haven't sent a response yet
        if (!res.headersSent) {
            return res.status(500).json({
                error: 'Internal server error processing webhook',
                message: error.message
            });
        }
    }
});

/**
 * GET /webhook/:automationId
 * 
 * Health check / verification endpoint for webhook configuration.
 * Some services (e.g., Slack) send a GET to verify the webhook URL.
 */
router.get('/:automationId', async (req, res) => {
    const { automationId } = req.params;

    try {
        const automationDoc = await db.collection('automations').doc(automationId).get();

        if (!automationDoc.exists) {
            return res.status(404).json({ error: 'Automation not found' });
        }

        const trigger = typeof automationDoc.data().trigger === 'string'
            ? JSON.parse(automationDoc.data().trigger)
            : automationDoc.data().trigger;

        res.json({
            status: 'ok',
            automationId,
            triggerType: trigger?.type,
            webhookReady: trigger?.type === 'webhook',
            message: 'Webhook endpoint is active. Send POST requests to trigger automation.'
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to verify webhook endpoint' });
    }
});

export default router;
