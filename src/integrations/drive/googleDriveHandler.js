/**
 * Google Drive Handler
 * 
 * Upload files and list contents from user's Google Drive via OAuth2.
 * Requires user to have connected their Google account with drive.file scope.
 */

import { google } from 'googleapis';
import { Readable } from 'stream';
import { getAuthenticatedClient } from '../../services/googleOAuth.js';
import logger from '../../utils/logger.js';

/**
 * Upload content as a file to Google Drive.
 * 
 * @param {Object} params
 * @param {string} params.fileName - Name for the file
 * @param {string} params.content - File content (text/JSON)
 * @param {string} [params.mimeType] - MIME type (default: text/plain)
 * @param {string} [params.folderId] - Drive folder ID (default: root)
 * @param {Object} context - Execution context
 * @returns {Object} Upload result with fileId and webViewLink
 */
export const uploadToDrive = async (params, context) => {
    const { fileName, content, mimeType = 'text/plain', folderId } = params;
    const userId = context?.userId || context?.user?.id;

    if (!userId) throw new Error('upload_to_drive: User context required. Connect your Google account first.');
    if (!fileName) throw new Error('upload_to_drive: "fileName" is required');
    if (!content) throw new Error('upload_to_drive: "content" is required');

    logger.info('📁 Uploading to Google Drive', { fileName, mimeType, userId });
    const startTime = Date.now();

    try {
        const authClient = await getAuthenticatedClient(userId);
        const drive = google.drive({ version: 'v3', auth: authClient });

        const fileMetadata = { name: fileName };
        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        // Convert string content to a readable stream
        const contentStr = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
        const stream = Readable.from([contentStr]);

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
                mimeType,
                body: stream
            },
            fields: 'id, name, mimeType, size, webViewLink, createdTime'
        });

        const duration = Date.now() - startTime;

        const result = {
            uploaded: true,
            fileId: response.data.id,
            fileName: response.data.name,
            mimeType: response.data.mimeType,
            size: response.data.size,
            webViewLink: response.data.webViewLink,
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };

        logger.info('✅ Drive upload complete', { fileId: result.fileId, fileName, duration_ms: duration });
        return result;

    } catch (error) {
        logger.error('❌ Drive upload failed', {
            fileName, error: error.message, duration_ms: Date.now() - startTime
        });
        throw new Error(`upload_to_drive failed: ${error.message}`);
    }
};

/**
 * List files in a Google Drive folder.
 * 
 * @param {Object} params
 * @param {string} [params.folderId] - Folder ID (default: root)
 * @param {string} [params.query] - Search query (Drive search syntax)
 * @param {number} [params.limit] - Max results (default: 20)
 * @param {Object} context - Execution context
 * @returns {Object} List result with files array
 */
export const listDriveFiles = async (params, context) => {
    const { folderId, query, limit = 20 } = params;
    const userId = context?.userId || context?.user?.id;

    if (!userId) throw new Error('list_drive_files: User context required. Connect your Google account first.');

    logger.info('📁 Listing Drive files', { folderId, query, limit, userId });
    const startTime = Date.now();

    try {
        const authClient = await getAuthenticatedClient(userId);
        const drive = google.drive({ version: 'v3', auth: authClient });

        // Build query
        let q = '';
        if (folderId) {
            q = `'${folderId}' in parents`;
        }
        if (query) {
            q = q ? `${q} and (${query})` : query;
        }
        // Exclude trashed files
        q = q ? `${q} and trashed = false` : 'trashed = false';

        const response = await drive.files.list({
            q,
            pageSize: limit,
            fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
            orderBy: 'modifiedTime desc'
        });

        const duration = Date.now() - startTime;

        const result = {
            files: response.data.files || [],
            totalFiles: (response.data.files || []).length,
            query: q,
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };

        logger.info('✅ Drive files listed', { count: result.totalFiles, duration_ms: duration });
        return result;

    } catch (error) {
        logger.error('❌ Drive list failed', {
            error: error.message, duration_ms: Date.now() - startTime
        });
        throw new Error(`list_drive_files failed: ${error.message}`);
    }
};

export default { uploadToDrive, listDriveFiles };
