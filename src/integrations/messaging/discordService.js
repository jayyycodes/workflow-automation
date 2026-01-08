/**
 * Discord Service  
 * Send messages via Discord webhooks
 */

import axios from 'axios';
import logger from '../../utils/logger.js';

class DiscordService {
    constructor() {
        this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    }

    isReady() {
        return !!this.webhookUrl;
    }

    /**
     * Send message to Discord via webhook
     * @param {string} webhookUrl - Discord webhook URL (optional, uses env if not provided)
     * @param {string} message - Message text
     * @param {object} options - Additional options (embed, username, avatar)
     */
    async sendMessage(webhookUrl, message, options = {}) {
        const url = webhookUrl || this.webhookUrl;

        if (!url) {
            throw new Error('Discord webhook URL not configured. Set DISCORD_WEBHOOK_URL in .env or provide webhookUrl parameter.');
        }

        const payload = {};

        // Simple text message
        if (typeof message === 'string' && !options.embed) {
            payload.content = message;
        }

        // Rich embed
        if (options.embed) {
            payload.embeds = [{
                title: options.embed.title || 'Automation Alert',
                description: message,
                color: options.embed.color || 3447003, // Blue color
                timestamp: new Date().toISOString(),
                footer: {
                    text: options.embed.footer || 'Smart Workflow Automation'
                },
                fields: options.embed.fields || []
            }];
        }

        // Custom bot name/avatar
        if (options.username) payload.username = options.username;
        if (options.avatar_url) payload.avatar_url = options.avatar_url;

        logger.info('Sending Discord message', {
            hasEmbed: !!options.embed,
            messageLength: message.length
        });

        try {
            await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            logger.info('Discord message sent successfully');

            return {
                success: true,
                channel: 'discord',
                sent: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Discord webhook failed', { error: error.message });
            throw new Error(`Discord send failed: ${error.message}`);
        }
    }
}

export default new DiscordService();
