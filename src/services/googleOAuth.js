/**
 * Google OAuth2 Service
 * 
 * Handles Google Sign-in and per-user OAuth consent flow for API access.
 * Stores tokens in Firestore `user_tokens` collection, keyed by userId.
 * 
 * Supports incremental authorization (request additional scopes later).
 */

import { google } from 'googleapis';
import { db } from '../config/firebase.js';
import logger from '../utils/logger.js';

// ─── Scopes ──────────────────────────────────────────────────────────────

export const GOOGLE_SCOPES = {
    // Basic profile (for Sign-in)
    PROFILE: ['openid', 'email', 'profile'],

    // Google Sheets
    SHEETS: ['https://www.googleapis.com/auth/spreadsheets'],

    // Gmail (send only)
    GMAIL: ['https://www.googleapis.com/auth/gmail.send'],

    // Google Drive (file-level access)
    DRIVE: ['https://www.googleapis.com/auth/drive.file'],

    // Google Calendar (events)
    CALENDAR: ['https://www.googleapis.com/auth/calendar.events'],
};

// All API scopes combined (for full connection)
export const ALL_API_SCOPES = [
    ...GOOGLE_SCOPES.SHEETS,
    ...GOOGLE_SCOPES.GMAIL,
    ...GOOGLE_SCOPES.DRIVE,
    ...GOOGLE_SCOPES.CALENDAR,
];

// ─── OAuth2 Client ───────────────────────────────────────────────────────

function createOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret) {
        throw new Error('Google OAuth: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// ─── Auth URL Generation ─────────────────────────────────────────────────

/**
 * Generate Google OAuth consent URL.
 * 
 * @param {string} userId - User ID to embed in state for callback
 * @param {string[]} scopes - OAuth scopes to request
 * @param {string} purpose - 'login' | 'connect' (determines flow type)
 * @returns {string} Google OAuth consent URL
 */
export function getAuthUrl(userId, scopes, purpose = 'connect') {
    const client = createOAuth2Client();

    const state = JSON.stringify({ userId, purpose });

    return client.generateAuthUrl({
        access_type: 'offline',       // Get refresh_token
        prompt: 'consent',            // Always show consent to get refresh_token
        scope: scopes,
        state: Buffer.from(state).toString('base64'),
        include_granted_scopes: true, // Incremental authorization
    });
}

/**
 * Generate login URL (profile + all API scopes for full access).
 */
export function getLoginUrl() {
    const client = createOAuth2Client();

    const state = JSON.stringify({ purpose: 'login' });

    return client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [...GOOGLE_SCOPES.PROFILE, ...ALL_API_SCOPES],
        state: Buffer.from(state).toString('base64'),
        include_granted_scopes: true,
    });
}

// ─── Token Exchange ──────────────────────────────────────────────────────

/**
 * Exchange authorization code for tokens and optionally store them.
 * 
 * @param {string} code - Authorization code from Google callback
 * @param {string} stateBase64 - Base64-encoded state parameter
 * @returns {Object} { tokens, state, userInfo }
 */
export async function handleCallback(code, stateBase64) {
    const client = createOAuth2Client();

    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Parse state
    let state = {};
    try {
        state = JSON.parse(Buffer.from(stateBase64, 'base64').toString('utf-8'));
    } catch (e) {
        logger.warn('Failed to parse OAuth state', { error: e.message });
    }

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data: userInfo } = await oauth2.userinfo.get();

    logger.info('Google OAuth callback processed', {
        email: userInfo.email,
        purpose: state.purpose,
        hasRefreshToken: !!tokens.refresh_token,
        scopes: tokens.scope?.split(' '),
    });

    return { tokens, state, userInfo };
}

// ─── Token Storage (Firestore) ───────────────────────────────────────────

/**
 * Store Google OAuth tokens for a user.
 */
export async function storeUserTokens(userId, tokens, scopes) {
    const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope || scopes?.join(' '),
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    await db.collection('user_tokens').doc(userId).set(
        { google: tokenData },
        { merge: true }
    );

    logger.info('Google tokens stored for user', { userId, scopes: tokenData.scope });
}

/**
 * Get stored Google tokens for a user.
 * Returns null if not connected.
 */
export async function getUserTokens(userId) {
    const doc = await db.collection('user_tokens').doc(userId).get();
    if (!doc.exists) return null;

    const data = doc.data();
    return data?.google || null;
}

/**
 * Get an authenticated OAuth2 client for a specific user.
 * Handles token refresh automatically.
 * 
 * @param {string} userId - Firestore user ID
 * @returns {google.auth.OAuth2} Authenticated client
 * @throws {Error} If user has no stored tokens
 */
export async function getAuthenticatedClient(userId) {
    const tokens = await getUserTokens(userId);
    if (!tokens) {
        throw new Error(
            'Google not connected. Please connect your Google account in Settings → Integrations.'
        );
    }

    const client = createOAuth2Client();
    client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
    });

    // Handle automatic token refresh
    client.on('tokens', async (newTokens) => {
        logger.info('Google token refreshed for user', { userId });
        // Merge new tokens (Google only sends refresh_token on first auth)
        const updated = {
            ...tokens,
            access_token: newTokens.access_token,
            expiry_date: newTokens.expiry_date,
            updated_at: new Date().toISOString(),
        };
        if (newTokens.refresh_token) {
            updated.refresh_token = newTokens.refresh_token;
        }
        await db.collection('user_tokens').doc(userId).set(
            { google: updated },
            { merge: true }
        );
    });

    return client;
}

/**
 * Check which Google services a user has connected.
 */
export async function getConnectionStatus(userId) {
    const tokens = await getUserTokens(userId);
    if (!tokens) {
        return { connected: false, services: {} };
    }

    const scopes = (tokens.scope || '').split(' ');

    return {
        connected: true,
        connectedAt: tokens.connected_at,
        services: {
            sheets: scopes.some(s => s.includes('spreadsheets')),
            gmail: scopes.some(s => s.includes('gmail')),
            drive: scopes.some(s => s.includes('drive')),
            calendar: scopes.some(s => s.includes('calendar')),
        }
    };
}

/**
 * Disconnect Google account (remove tokens).
 */
export async function disconnectGoogle(userId) {
    await db.collection('user_tokens').doc(userId).delete();
    logger.info('Google account disconnected', { userId });
}

export default {
    GOOGLE_SCOPES,
    ALL_API_SCOPES,
    getAuthUrl,
    getLoginUrl,
    handleCallback,
    storeUserTokens,
    getUserTokens,
    getAuthenticatedClient,
    getConnectionStatus,
    disconnectGoogle,
};
