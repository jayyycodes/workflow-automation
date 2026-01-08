/**
 * Slack Service
 * Send messages via Slack Incoming Webhooks
 */

import axios from 'axios';
import logger from '../../utils/logger.js';

class SlackService {
    constructor() {
        this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    }

    isReady() {
        return !!this.webhookUrl;
    }

    /**
     * Send message to Slack via webhook
     * @param {string} webhookUrl - Slack webhook URL (optional, uses env if not provided)
     * @param {string} message - Message text
     * @param {object} options - Additional options (channel, username, icon, blocks)
     */
    async sendMessage(webhookUrl, message, options = {}) {
        const url = webhookUrl || this.webhookUrl;

        if (!url) {
            throw new Error('Slack webhook URL not configured. Set SLACK_WEBHOOK_URL in .env or provide webhookUrl parameter.');
        }

        const payload = {
            text: message
        };

        // Optional: override channel, username, icon
        if (options.channel) payload.channel = options.channel;
        if (options.username) payload.username = options.username;
        if (options.icon_emoji) payload.icon_emoji = options.icon_emoji;
        if (options.icon_url) payload.icon_url = options.icon_url;

        // Rich blocks (Slack Block Kit)
        if (options.blocks) {
            payload.blocks = options.blocks;
        }

        logger.info('Sending Slack message', {
            hasBlocks: !!options.blocks,
            messageLength: message.length
        });

        try {
            const response = await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            if (response.data !== 'ok') {
                throw new Error(`Slack API returned: ${response.data}`);
            }

            logger.info('Slack message sent successfully');

            return {
                success: true,
                channel: 'slack',
                sent: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Slack webhook failed', { error: error.message });
            throw new Error(`Slack send failed: ${error.message}`);
        }
    }
}

export default new SlackService();
