/**
 * Email Service - SendGrid API
 * 
 * Uses SendGrid API instead of SMTP to avoid port blocking on Render.
 */

import sgMail from '@sendgrid/mail';
import logger from '../../utils/logger.js';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    logger.info('SendGrid initialized successfully');
} else {
    logger.warn('SENDGRID_API_KEY not configured - email sending will fail');
}

/**
 * Send an email using SendGrid API
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body (plain text or HTML)
 * @returns {Promise<Object>} - Send result
 */
export const sendEmail = async ({ to, subject, body }) => {
    // Validate required fields
    if (!to) {
        throw new Error('Recipient email (to) is required');
    }
    if (!subject) {
        throw new Error('Email subject is required');
    }
    if (!body) {
        throw new Error('Email body is required');
    }

    if (!SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY environment variable is not set');
    }

    logger.info('Sending email via SendGrid', {
        to: to,
        subject: subject,
        from: EMAIL_FROM
    });

    try {
        const msg = {
            to: to,
            from: EMAIL_FROM,
            subject: subject,
            text: body,
            html: body.replace(/\n/g, '<br>') // Convert newlines to HTML breaks
        };

        const result = await sgMail.send(msg);

        logger.info('Email sent successfully via SendGrid', {
            to: to,
            subject: subject,
            statusCode: result[0].statusCode
        });

        return {
            success: true,
            messageId: result[0].headers['x-message-id'],
            to: to,
            subject: subject,
            provider: 'sendgrid',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error('Failed to send email via SendGrid', {
            to: to,
            subject: subject,
            error: error.message,
            code: error.code,
            response: error.response?.body
        });

        throw new Error(`Email send failed: ${error.message}`);
    }
};

/**
 * Test email configuration
 */
export const testEmailConfig = () => {
    return {
        configured: !!SENDGRID_API_KEY,
        provider: 'sendgrid',
        from: EMAIL_FROM
    };
};
