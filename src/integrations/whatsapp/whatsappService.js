import twilio from 'twilio';
import logger from '../../utils/logger.js';

class WhatsAppService {
    constructor() {
        this.client = null;
        this.whatsappNumber = null;
        this.isConfigured = false;

        this.initialize();
    }

    initialize() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

        if (!accountSid || !authToken || !whatsappNumber) {
            logger.warn('Twilio WhatsApp credentials not configured. WhatsApp notifications will be disabled.');
            return;
        }

        try {
            this.client = twilio(accountSid, authToken);
            this.whatsappNumber = whatsappNumber;
            this.isConfigured = true;
            logger.info('WhatsApp service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize WhatsApp service:', error);
            this.isConfigured = false;
        }
    }

    /**
     * Format phone number for WhatsApp
     * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
     * @returns {string} Formatted WhatsApp number (e.g., whatsapp:+919876543210)
     */
    formatWhatsAppNumber(phoneNumber) {
        // Remove any existing 'whatsapp:' prefix
        const cleanNumber = phoneNumber.replace(/^whatsapp:/i, '');

        // Ensure the number starts with '+'
        const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;

        return `whatsapp:${formattedNumber}`;
    }

    /**
     * Send WhatsApp message
     * @param {string} to - Recipient phone number (e.g., +919876543210)
     * @param {string} message - Message content
     * @returns {Promise<Object>} Result with success status and details
     */
    async sendMessage(to, message) {
        if (!this.isConfigured) {
            return {
                success: false,
                error: 'WhatsApp service is not configured. Please add Twilio credentials to .env file.',
                messageSid: null
            };
        }

        try {
            const formattedTo = this.formatWhatsAppNumber(to);

            logger.info(`Sending WhatsApp message to ${formattedTo}`);

            const result = await this.client.messages.create({
                from: this.whatsappNumber,
                to: formattedTo,
                body: message
            });

            logger.info(`WhatsApp message sent successfully. SID: ${result.sid}`);

            return {
                success: true,
                messageSid: result.sid,
                status: result.status,
                to: formattedTo,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Failed to send WhatsApp message:', error);

            return {
                success: false,
                error: error.message || 'Failed to send WhatsApp message',
                errorCode: error.code,
                messageSid: null
            };
        }
    }

    /**
     * Check if WhatsApp service is ready
     * @returns {boolean}
     */
    isReady() {
        return this.isConfigured;
    }

    /**
     * Get service status
     * @returns {Object}
     */
    getStatus() {
        return {
            configured: this.isConfigured,
            whatsappNumber: this.whatsappNumber
        };
    }
}

// Export singleton instance
export default new WhatsAppService();
