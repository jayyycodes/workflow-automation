/**
 * Gmail Handler
 * 
 * Send emails via user's own Gmail account using OAuth2.
 * Requires user to have connected their Google account with gmail.send scope.
 */

import { google } from 'googleapis';
import { getAuthenticatedClient } from '../../services/googleOAuth.js';
import logger from '../../utils/logger.js';

/**
 * Send an email via the user's Gmail account.
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body (plain text or HTML)
 * @param {string} [params.cc] - CC recipients (comma-separated)
 * @param {string} [params.bcc] - BCC recipients (comma-separated)
 * @param {boolean} [params.html] - If true, body is treated as HTML
 * @param {Object} context - Execution context (must include userId)
 * @returns {Object} Send result with messageId and threadId
 */
export const sendGmail = async (params, context) => {
    const { to, subject, body, cc, bcc, html } = params;
    const userId = context?.userId || context?.user?.id;

    if (!userId) throw new Error('send_gmail: User context required. Connect your Google account first.');
    if (!to) throw new Error('send_gmail: "to" email address is required');
    if (!subject) throw new Error('send_gmail: "subject" is required');
    if (!body) throw new Error('send_gmail: "body" is required');

    logger.info('📧 Sending Gmail', { to, subject, userId });
    const startTime = Date.now();

    try {
        const authClient = await getAuthenticatedClient(userId);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        // Build RFC 2822 email message
        const contentType = html ? 'text/html' : 'text/plain';
        const messageParts = [
            `To: ${to}`,
            `Subject: ${subject}`,
            `Content-Type: ${contentType}; charset=utf-8`,
            'MIME-Version: 1.0',
        ];

        if (cc) messageParts.splice(1, 0, `Cc: ${cc}`);
        if (bcc) messageParts.splice(1, 0, `Bcc: ${bcc}`);

        messageParts.push('', body);

        const rawMessage = messageParts.join('\r\n');
        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        const duration = Date.now() - startTime;

        const result = {
            sent: true,
            messageId: response.data.id,
            threadId: response.data.threadId,
            to,
            subject,
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };

        logger.info('✅ Gmail sent', { messageId: result.messageId, to, duration_ms: duration });
        return result;

    } catch (error) {
        logger.error('❌ Gmail send failed', {
            to, subject, error: error.message, duration_ms: Date.now() - startTime
        });
        throw new Error(`send_gmail failed: ${error.message}`);
    }
};

export default { sendGmail };
