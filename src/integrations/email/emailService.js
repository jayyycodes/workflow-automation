/**
 * Email Service - Unified Provider with Auto-Fallback
 * 
 * Primary: Gmail SMTP (works locally)
 * Fallback: SendGrid API (works on Render/cloud)
 * 
 * If Gmail fails (common on Render), automatically retries via SendGrid.
 * No manual config needed — just set both GMAIL + SENDGRID env vars.
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

// Provider availability
const hasGmail = !!(GMAIL_USER && GMAIL_APP_PASSWORD);
const hasSendGrid = !!SENDGRID_API_KEY;

// Primary provider selection (Gmail preferred locally, SendGrid on cloud)
const getProvider = () => {
    if (hasGmail) return 'gmail';
    if (hasSendGrid) return 'sendgrid';
    return 'none';
};

const ACTIVE_PROVIDER = getProvider();

// Initialize Providers
if (hasSendGrid) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

if (ACTIVE_PROVIDER === 'gmail') {
    logger.info(`Email Service: Primary=Gmail SMTP${hasSendGrid ? ', Fallback=SendGrid API' : ''}`);
} else if (ACTIVE_PROVIDER === 'sendgrid') {
    logger.info('Email Service: Using SendGrid API');
} else {
    logger.warn('Email Service: No provider configured (set GMAIL or SENDGRID env vars)');
}

/**
 * Send an email with automatic fallback
 * 
 * 1. Try primary provider (Gmail SMTP or SendGrid)
 * 2. If Gmail fails and SendGrid is available, retry via SendGrid
 * 3. Return result with provider info
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
    } catch (primaryError) {
        // Auto-fallback: Gmail failed → try SendGrid
        if (ACTIVE_PROVIDER === 'gmail' && hasSendGrid) {
            logger.warn(`Gmail SMTP failed (${primaryError.message}), falling back to SendGrid...`);
            try {
                const result = await sendViaSendGrid({ to, subject, body });
                logger.info('Email sent successfully via SendGrid fallback');
                return { ...result, fallback: true, primaryError: primaryError.message };
            } catch (fallbackError) {
                logger.error('SendGrid fallback also failed', { error: fallbackError.message });
                throw new Error(`All email providers failed. Gmail: ${primaryError.message}, SendGrid: ${fallbackError.message}`);
            }
        }

        // Auto-fallback: SendGrid failed → try Gmail
        if (ACTIVE_PROVIDER === 'sendgrid' && hasGmail) {
            logger.warn(`SendGrid failed (${primaryError.message}), falling back to Gmail SMTP...`);
            try {
                const result = await sendViaGmail({ to, subject, body });
                logger.info('Email sent successfully via Gmail fallback');
                return { ...result, fallback: true, primaryError: primaryError.message };
            } catch (fallbackError) {
                logger.error('Gmail fallback also failed', { error: fallbackError.message });
                throw new Error(`All email providers failed. SendGrid: ${primaryError.message}, Gmail: ${fallbackError.message}`);
            }
        }

        // No fallback available
        logger.error(`Failed to send email via ${ACTIVE_PROVIDER}`, {
            to,
            error: primaryError.message
        });
        throw new Error(`Email send failed: ${primaryError.message}`);
    }
};

// --- Gmail Implementation ---
const sendViaGmail = async ({ to, subject, body }) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD
        },
        // Timeout for cloud environments where SMTP may be blocked
        connectionTimeout: 10000,  // 10s connection timeout
        greetingTimeout: 10000,    // 10s greeting timeout
        socketTimeout: 15000       // 15s socket timeout
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

    logger.info('Email sent successfully via SendGrid', { code: result[0].statusCode });

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
        fallback: (ACTIVE_PROVIDER === 'gmail' && hasSendGrid) ? 'sendgrid' :
            (ACTIVE_PROVIDER === 'sendgrid' && hasGmail) ? 'gmail' : 'none',
        from: ACTIVE_PROVIDER === 'gmail' ? GMAIL_USER : EMAIL_FROM
    };
};
