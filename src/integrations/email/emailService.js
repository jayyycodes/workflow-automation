/**
 * Email Service - Unified Provider (SendGrid + Gmail SMTP)
 * 
 * Supports switching between SendGrid (API) and Gmail (SMTP)
 * to avoid delivery issues during demos.
 */

import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import logger from '../../utils/logger.js';

// Configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';

// Gmail SMTP Configuration
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Provider Selection logic
const getProvider = () => {
    if (GMAIL_USER && GMAIL_APP_PASSWORD) {
        return 'gmail';
    }
    if (SENDGRID_API_KEY) {
        return 'sendgrid';
    }
    return 'none';
};

const ACTIVE_PROVIDER = getProvider();

// Initialize Providers
if (ACTIVE_PROVIDER === 'sendgrid') {
    sgMail.setApiKey(SENDGRID_API_KEY);
    logger.info('Email Service: Using SendGrid API');
} else if (ACTIVE_PROVIDER === 'gmail') {
    logger.info('Email Service: Using Gmail SMTP');
} else {
    logger.warn('Email Service: No provider configured (SendGrid or Gmail)');
}

/**
 * Send an email using the active provider
 */
export const sendEmail = async ({ to, subject, body }) => {
    // Validate required fields
    if (!to) throw new Error('Recipient email (to) is required');
    if (!subject) throw new Error('Email subject is required');
    if (!body) throw new Error('Email body is required');

    if (ACTIVE_PROVIDER === 'none') {
        throw new Error('No email provider configured. Set SENDGRID_API_KEY or GMAIL_USER/PASS');
    }

    logger.info(`Sending email via ${ACTIVE_PROVIDER}`, { to, subject });

    try {
        if (ACTIVE_PROVIDER === 'gmail') {
            return await sendViaGmail({ to, subject, body });
        } else {
            return await sendViaSendGrid({ to, subject, body });
        }
    } catch (error) {
        logger.error(`Failed to send email via ${ACTIVE_PROVIDER}`, {
            to,
            error: error.message
        });
        throw new Error(`Email send failed: ${error.message}`);
    }
};

// --- Gmail Implementation ---
const sendViaGmail = async ({ to, subject, body }) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD
        }
    });

    const info = await transporter.sendMail({
        from: `Workflow Automation <${GMAIL_USER}>`,
        to: to,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>')
    });

    logger.info('Email sent successfully via Gmail SMTP', { messageId: info.messageId });

    return {
        success: true,
        messageId: info.messageId,
        provider: 'gmail',
        timestamp: new Date().toISOString()
    };
};

// --- SendGrid Implementation ---
const sendViaSendGrid = async ({ to, subject, body }) => {
    const msg = {
        to,
        from: EMAIL_FROM,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>')
    };

    const result = await sgMail.send(msg);

    logger.info('Email sent successfully via SendGrid status', { code: result[0].statusCode });

    return {
        success: true,
        messageId: result[0].headers['x-message-id'],
        provider: 'sendgrid',
        timestamp: new Date().toISOString()
    };
};

/**
 * Test email configuration
 */
export const testEmailConfig = () => {
    return {
        configured: ACTIVE_PROVIDER !== 'none',
        provider: ACTIVE_PROVIDER,
        from: ACTIVE_PROVIDER === 'gmail' ? GMAIL_USER : EMAIL_FROM
    };
};
