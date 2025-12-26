/**
 * Email Service
 * 
 * Sends real emails using nodemailer with SMTP configuration.
 * Part of Step 5: Email Integration
 */

import nodemailer from 'nodemailer';
import logger from '../../utils/logger.js';

/**
 * Create nodemailer transporter based on environment configuration
 */
const createTransporter = () => {
    const config = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    };

    logger.debug('Creating email transporter', {
        host: config.host,
        port: config.port,
        user: config.auth.user ? '***configured***' : 'NOT SET'
    });

    return nodemailer.createTransport(config);
};

/**
 * Send an email
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body (plain text)
 * @returns {Promise<Object>} - Send result with messageId
 */
export const sendEmail = async ({ to, subject, body }) => {
    // Validate required fields
    if (!to) {
        throw new Error('Email recipient (to) is required');
    }
    if (!subject) {
        throw new Error('Email subject is required');
    }
    if (!body) {
        throw new Error('Email body is required');
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in .env');
    }

    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const mailOptions = {
        from,
        to,
        subject,
        text: body
    };

    logger.info('Sending email', { to, subject });

    try {
        const result = await transporter.sendMail(mailOptions);

        logger.info('Email sent successfully', {
            messageId: result.messageId,
            to,
            subject
        });

        return {
            success: true,
            messageId: result.messageId,
            accepted: result.accepted,
            rejected: result.rejected
        };
    } catch (error) {
        logger.error('Failed to send email', {
            to,
            subject,
            error: error.message
        });
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

export default { sendEmail };
