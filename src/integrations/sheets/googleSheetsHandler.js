/**
 * Google Sheets Handler
 * 
 * Read, write, and append data to Google Sheets.
 * Supports:
 * - Per-user OAuth tokens (primary — user's own Google account)
 * - Service account fallback (legacy — base64 JSON in env var)
 */

import { google } from 'googleapis';
import { getAuthenticatedClient } from '../../services/googleOAuth.js';
import { db } from '../../config/firebase.js';
import logger from '../../utils/logger.js';

// ─── Auth ──────────────────────────────────────────────────────────────

/**
 * Get Sheets client — per-user OAuth if context.userId available,
 * otherwise falls back to service account.
 */
async function getSheetsClient(context) {
    const userId = context?.userId || context?.user?.id;

    // Try per-user OAuth first
    if (userId) {
        try {
            const authClient = await getAuthenticatedClient(userId);
            logger.info('📊 Using per-user OAuth for Google Sheets', { userId });
            return google.sheets({ version: 'v4', auth: authClient });
        } catch (err) {
            logger.warn('Per-user OAuth not available, trying service account', {
                userId, error: err.message
            });
        }
    }

    // Fallback: service account
    const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (keyBase64) {
        const keyJson = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'));
        const auth = new google.auth.GoogleAuth({
            credentials: keyJson,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        logger.info('📊 Using service account for Google Sheets');
        return google.sheets({ version: 'v4', auth });
    }

    throw new Error(
        'Google Sheets not configured. Please connect your Google account in Settings → Integrations, ' +
        'or set GOOGLE_SERVICE_ACCOUNT_KEY in .env.'
    );
}

/**
 * Get or create a Google Spreadsheet for this automation.
 * Stores the spreadsheet ID in Firestore so it's reused across runs.
 */
async function getOrCreateSpreadsheet(context, title = 'SmartFlow Automation Data') {
    const userId = context?.userId || context?.user?.id;
    const automationId = context?.automationId;
    if (!userId) throw new Error('Cannot auto-create sheet: no user context');

    // Check if this automation already has a saved spreadsheet
    if (automationId) {
        try {
            const autoDoc = await db.collection('automations').doc(automationId).get();
            const savedSheetId = autoDoc.data()?.auto_spreadsheet_id;
            if (savedSheetId) {
                logger.info('📊 Reusing existing spreadsheet for automation', { automationId, spreadsheetId: savedSheetId });
                return { spreadsheetId: savedSheetId, url: `https://docs.google.com/spreadsheets/d/${savedSheetId}/edit`, reused: true };
            }
        } catch (e) {
            logger.warn('Could not check for existing spreadsheet', { error: e.message });
        }
    }

    // Create new spreadsheet
    const authClient = await getAuthenticatedClient(userId);
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.create({
        requestBody: {
            properties: { title },
            sheets: [{ properties: { title: 'Sheet1' } }]
        }
    });

    const newId = response.data.spreadsheetId;
    const url = response.data.spreadsheetUrl;
    logger.info('📊 Auto-created new Google Spreadsheet', { spreadsheetId: newId, title, url });

    // Save the sheet ID to the automation for reuse
    if (automationId) {
        try {
            await db.collection('automations').doc(automationId).update({
                auto_spreadsheet_id: newId,
                auto_spreadsheet_url: url
            });
            logger.info('📊 Saved spreadsheet ID to automation', { automationId, spreadsheetId: newId });
        } catch (e) {
            logger.warn('Could not save spreadsheet ID to automation', { error: e.message });
        }
    }

    return { spreadsheetId: newId, url };
}

function needsAutoCreate(id) {
    return !id || id === 'your_sheet_id' || id === 'YOUR_SHEET_ID' || id === 'auto';
}

// ─── Read ──────────────────────────────────────────────────────────────

export const readGoogleSheet = async (params, context) => {
    const { spreadsheetId, range } = params;

    if (!spreadsheetId) throw new Error('read_google_sheet: "spreadsheetId" is required');
    if (!range) throw new Error('read_google_sheet: "range" is required');

    logger.info('📊 Reading Google Sheet', { spreadsheetId, range });
    const startTime = Date.now();

    try {
        const sheets = await getSheetsClient(context);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range
        });

        const values = response.data.values || [];
        const duration = Date.now() - startTime;

        const result = {
            spreadsheetId,
            range: response.data.range,
            values,
            rowCount: values.length,
            columnCount: values[0]?.length || 0,
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };

        logger.info('✅ Google Sheet read', { rows: result.rowCount, duration_ms: duration });
        return result;

    } catch (error) {
        logger.error('❌ Google Sheet read failed', {
            spreadsheetId, range, error: error.message, duration_ms: Date.now() - startTime
        });
        throw new Error(`read_google_sheet failed: ${error.message}`);
    }
};

// ─── Write ─────────────────────────────────────────────────────────────

export const writeGoogleSheet = async (params, context) => {
    let { spreadsheetId, range, values } = params;

    if (!range) range = 'Sheet1!A1';
    if (!values || !Array.isArray(values)) throw new Error('write_google_sheet: "values" must be a 2D array');

    // Auto-create spreadsheet if no ID provided
    let autoCreated = null;
    if (needsAutoCreate(spreadsheetId)) {
        autoCreated = await getOrCreateSpreadsheet(context, params.sheetTitle || 'SmartFlow Data');
        spreadsheetId = autoCreated.spreadsheetId;
    }

    logger.info('📊 Writing Google Sheet', { spreadsheetId, range, rows: values.length });
    const startTime = Date.now();

    try {
        const sheets = await getSheetsClient(context);

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values }
        });

        const duration = Date.now() - startTime;

        const result = {
            spreadsheetId,
            updatedRange: response.data.updatedRange,
            updatedRows: response.data.updatedRows,
            updatedColumns: response.data.updatedColumns,
            updatedCells: response.data.updatedCells,
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };
        if (autoCreated) result.spreadsheetUrl = autoCreated.url;

        logger.info('✅ Google Sheet written', { updatedCells: result.updatedCells, duration_ms: duration });
        return result;

    } catch (error) {
        logger.error('❌ Google Sheet write failed', {
            spreadsheetId, range, error: error.message, duration_ms: Date.now() - startTime
        });
        throw new Error(`write_google_sheet failed: ${error.message}`);
    }
};

// ─── Append ────────────────────────────────────────────────────────────

export const appendGoogleSheet = async (params, context) => {
    let { spreadsheetId, range, values } = params;

    if (!range) range = 'Sheet1!A1';
    if (!values || !Array.isArray(values)) throw new Error('append_google_sheet: "values" must be a 2D array');

    // Auto-create spreadsheet if no ID provided
    let autoCreated = null;
    if (needsAutoCreate(spreadsheetId)) {
        autoCreated = await getOrCreateSpreadsheet(context, params.sheetTitle || 'SmartFlow Data');
        spreadsheetId = autoCreated.spreadsheetId;
    }

    logger.info('📊 Appending to Google Sheet', { spreadsheetId, range, rows: values.length });
    const startTime = Date.now();

    try {
        const sheets = await getSheetsClient(context);

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values }
        });

        const duration = Date.now() - startTime;

        const result = {
            spreadsheetId,
            updatedRange: response.data.updates?.updatedRange,
            updatedRows: response.data.updates?.updatedRows,
            updatedCells: response.data.updates?.updatedCells,
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };
        if (autoCreated) result.spreadsheetUrl = autoCreated.url;

        logger.info('✅ Google Sheet appended', { updatedRows: result.updatedRows, duration_ms: duration });
        return result;

    } catch (error) {
        logger.error('❌ Google Sheet append failed', {
            spreadsheetId, range, error: error.message, duration_ms: Date.now() - startTime
        });
        throw new Error(`append_google_sheet failed: ${error.message}`);
    }
};

export default {
    readGoogleSheet,
    writeGoogleSheet,
    appendGoogleSheet
};
