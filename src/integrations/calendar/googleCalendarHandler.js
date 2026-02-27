/**
 * Google Calendar Handler
 * 
 * Create events and list upcoming events from user's Google Calendar via OAuth2.
 * Requires user to have connected their Google account with calendar.events scope.
 */

import { google } from 'googleapis';
import { getAuthenticatedClient } from '../../services/googleOAuth.js';
import logger from '../../utils/logger.js';

/**
 * Create a Google Calendar event.
 * 
 * @param {Object} params
 * @param {string} params.title - Event title/summary
 * @param {string} [params.description] - Event description
 * @param {string} params.startTime - Start time (ISO 8601 or natural like "2024-03-15T10:00:00")
 * @param {string} params.endTime - End time (ISO 8601)
 * @param {string} [params.location] - Event location
 * @param {string[]} [params.attendees] - Array of attendee email addresses
 * @param {string} [params.calendarId] - Calendar ID (default: "primary")
 * @param {Object} context - Execution context
 * @returns {Object} Created event with id and htmlLink
 */
export const createCalendarEvent = async (params, context) => {
    const { title, description, startTime, endTime, location, attendees, calendarId = 'primary' } = params;
    const userId = context?.userId || context?.user?.id;

    if (!userId) throw new Error('create_calendar_event: User context required. Connect your Google account first.');
    if (!title) throw new Error('create_calendar_event: "title" is required');
    if (!startTime) throw new Error('create_calendar_event: "startTime" is required');

    // Parse any date format — always interprets times as IST (user's local time)
    const parseSmartDate = (input) => {
        const str = (input || '').toString().trim();
        const strLower = str.toLowerCase();
        const now = new Date();

        // Determine the BASE DATE (which day?)
        let year = now.getFullYear(), month = now.getMonth(), day = now.getDate();
        let hours = 10, mins = 0; // default 10 AM

        // Check for ISO date format: extract date + time parts literally
        const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
        if (isoMatch) {
            year = parseInt(isoMatch[1]);
            month = parseInt(isoMatch[2]) - 1;
            day = parseInt(isoMatch[3]);
            if (isoMatch[4]) hours = parseInt(isoMatch[4]);
            if (isoMatch[5]) mins = parseInt(isoMatch[5]);
            // IMPORTANT: we use these numbers AS-IS (treat as IST, ignore any Z/offset)
            const d = new Date(year, month, day, hours, mins, 0);
            logger.info('📅 Parsed ISO date as IST', { input: str, result: d.toString() });
            return d;
        }

        // Natural language: determine which day
        if (strLower.includes('tomorrow')) {
            day = now.getDate() + 1;
        } else if (strLower.includes('today')) {
            // keep current day
        } else if (strLower.includes('next week') || strLower.includes('next monday')) {
            const daysUntilMon = (8 - now.getDay()) % 7 || 7;
            day = now.getDate() + daysUntilMon;
        } else if (strLower.match(/in (\d+) hour/)) {
            const h = parseInt(strLower.match(/in (\d+) hour/)[1]);
            const d = new Date(now.getTime() + h * 60 * 60 * 1000);
            logger.info('📅 Parsed relative time', { input: str, result: d.toString() });
            return d;
        } else if (strLower.match(/in (\d+) min/)) {
            const m = parseInt(strLower.match(/in (\d+) min/)[1]);
            const d = new Date(now.getTime() + m * 60 * 1000);
            logger.info('📅 Parsed relative time', { input: str, result: d.toString() });
            return d;
        }

        // Extract time: "3pm", "3:00 PM", "15:00", "10am", "10:00 AM"
        const timeMatch = strLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (timeMatch) {
            hours = parseInt(timeMatch[1]);
            mins = parseInt(timeMatch[2] || '0');
            const period = (timeMatch[3] || '').toLowerCase();
            if (period === 'pm' && hours < 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;
        }

        const result = new Date(year, month, day, hours, mins, 0);
        logger.info('📅 Parsed natural date', { input: str, result: result.toString() });
        return result;
    };

    const start = parseSmartDate(startTime);
    const end = endTime ? parseSmartDate(endTime) : new Date(start.getTime() + 60 * 60 * 1000);

    if (isNaN(start.getTime())) {
        throw new Error(`create_calendar_event: Could not parse startTime "${startTime}". Use ISO 8601 (e.g. 2026-02-28T15:00:00) or natural language (e.g. "tomorrow 3pm").`);
    }

    logger.info('📅 Creating calendar event', { title, startTime, parsedStart: start.toString(), userId });
    const startTimeMs = Date.now();

    try {
        const authClient = await getAuthenticatedClient(userId);
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // Format with explicit IST offset (+05:30) — completely unambiguous
        const toIST = (d) => {
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}+05:30`;
        };

        logger.info('📅 Event datetime strings', { start: toIST(start), end: toIST(end) });

        const event = {
            summary: title,
            description: description || '',
            location: location || '',
            start: {
                dateTime: toIST(start),
            },
            end: {
                dateTime: toIST(end),
            },
        };

        if (attendees && Array.isArray(attendees)) {
            event.attendees = attendees.map(email => ({ email }));
        }

        const response = await calendar.events.insert({
            calendarId,
            requestBody: event,
            sendUpdates: attendees?.length ? 'all' : 'none',
        });

        const duration = Date.now() - startTimeMs;

        const result = {
            created: true,
            eventId: response.data.id,
            title: response.data.summary,
            startTime: response.data.start.dateTime,
            endTime: response.data.end.dateTime,
            htmlLink: response.data.htmlLink,
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };

        logger.info('✅ Calendar event created', { eventId: result.eventId, title, duration_ms: duration });
        return result;

    } catch (error) {
        logger.error('❌ Calendar event creation failed', {
            title, error: error.message, duration_ms: Date.now() - startTimeMs
        });
        throw new Error(`create_calendar_event failed: ${error.message}`);
    }
};

/**
 * List upcoming Google Calendar events.
 * 
 * @param {Object} params
 * @param {number} [params.maxResults] - Maximum events to return (default: 10)
 * @param {string} [params.timeMin] - Start of time range (ISO 8601, default: now)
 * @param {string} [params.timeMax] - End of time range (ISO 8601)
 * @param {string} [params.calendarId] - Calendar ID (default: "primary")
 * @param {Object} context - Execution context
 * @returns {Object} List of upcoming events
 */
export const listCalendarEvents = async (params, context) => {
    const { maxResults = 10, timeMin, timeMax, calendarId = 'primary' } = params;
    const userId = context?.userId || context?.user?.id;

    if (!userId) throw new Error('list_calendar_events: User context required. Connect your Google account first.');

    logger.info('📅 Listing calendar events', { maxResults, userId });
    const startTimeMs = Date.now();

    try {
        const authClient = await getAuthenticatedClient(userId);
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        const listParams = {
            calendarId,
            timeMin: timeMin || new Date().toISOString(),
            maxResults,
            singleEvents: true,
            orderBy: 'startTime',
        };

        if (timeMax) {
            listParams.timeMax = timeMax;
        }

        const response = await calendar.events.list(listParams);
        const events = (response.data.items || []).map(event => ({
            eventId: event.id,
            title: event.summary,
            description: event.description || '',
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            location: event.location || '',
            htmlLink: event.htmlLink,
            attendees: (event.attendees || []).map(a => a.email),
        }));

        const duration = Date.now() - startTimeMs;

        const result = {
            events,
            totalEvents: events.length,
            timeRange: {
                from: listParams.timeMin,
                to: listParams.timeMax || 'unlimited'
            },
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };

        logger.info('✅ Calendar events listed', { count: result.totalEvents, duration_ms: duration });
        return result;

    } catch (error) {
        logger.error('❌ Calendar events list failed', {
            error: error.message, duration_ms: Date.now() - startTimeMs
        });
        throw new Error(`list_calendar_events failed: ${error.message}`);
    }
};

export default { createCalendarEvent, listCalendarEvents };
