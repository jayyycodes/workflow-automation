import twilio from 'twilio';
import logger from '../../utils/logger.js';

class SMSService {
    constructor() {
        this.client = null;
        this.phoneNumber = null;
        this.isConfigured = false;

        this.initialize();
    }

    initialize() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !phoneNumber) {
            logger.warn('Twilio SMS credentials not configured. SMS notifications will be disabled.');
            return;
        }

        try {
            this.client = twilio(accountSid, authToken);
            this.phoneNumber = phoneNumber;
            this.isConfigured = true;
            logger.info('SMS service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize SMS service:', error);
            this.isConfigured = false;
        }
    }

    /**
     * Format phone number for SMS
     * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210 or 9876543210)
     * @returns {string} Formatted phone number (e.g., +919876543210)
     */
    formatPhoneNumber(phoneNumber) {
        // Remove any whitespace
        let cleanNumber = phoneNumber.replace(/\s+/g, '');

        // Ensure the number starts with '+'
        if (!cleanNumber.startsWith('+')) {
            cleanNumber = `+${cleanNumber}`;
        }

        return cleanNumber;
    }

    /**
     * Send SMS message
     * @param {string} to - Recipient phone number (e.g., +919876543210)
     * @param {string} message - Message content
     * @returns {Promise<Object>} Result with success status and details
     */
    async sendSMS(to, message) {
        if (!this.isConfigured) {
            return {
                success: false,
                error: 'SMS service is not configured. Please add Twilio credentials to .env file.',
                messageSid: null
            };
        }

        try {
            const formattedTo = this.formatPhoneNumber(to);

            logger.info(`Sending SMS to ${formattedTo}`);

            const result = await this.client.messages.create({
                from: this.phoneNumber,
                to: formattedTo,
                body: message
            });

            logger.info(`SMS sent successfully. SID: ${result.sid}`);

            return {
                success: true,
                messageSid: result.sid,
                status: result.status,
                to: formattedTo,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Failed to send SMS:', error);

            return {
                success: false,
                error: error.message || 'Failed to send SMS',
                errorCode: error.code,
                messageSid: null
            };
        }
    }

    /**
     * Check if SMS service is ready
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
            phoneNumber: this.phoneNumber
        };
    }
}

// Export singleton instance
export default new SMSService();
