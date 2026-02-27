/**
 * Trigger Parser
 * 
 * Converts automation trigger JSON to cron expressions.
 * Supports: interval, daily
 */

import logger from '../utils/logger.js';

/**
 * Parse interval string to cron expression
 * 
 * @param {string} interval - e.g. "30s", "1m", "2m", "5m", "1h", "1d"
 * @returns {string|null} Cron expression or null if invalid
 */
const parseIntervalToCron = (interval) => {
    const match = interval.match(/^(\d+)(s|m|h|d|w)$/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': // Seconds - use */value for intervals < 60 seconds
            if (value >= 60) {
                logger.warn(`Seconds interval ${value}s >= 60, use minutes instead`);
                return null;
            }
            // Note: node-cron doesn't support seconds natively, so we'll use the minimum (1 minute)
            // For production, consider using a different scheduler that supports seconds
            logger.warn(`Seconds not supported by cron, converting ${value}s to 1m minimum`);
            return '*/1 * * * *';

        case 'm': // Minutes
            if (value >= 60) {
                logger.warn(`Minutes interval ${value}m >= 60, use hours instead`);
                return null;
            }
            return `*/${value} * * * *`;

        case 'h': // Hours
            if (value >= 24) {
                logger.warn(`Hours interval ${value}h >= 24, use days instead`);
                return null;
            }
            return `0 */${value} * * *`;

        case 'd': // Days
            if (value > 31) {
                logger.warn(`Days interval ${value}d > 31, consider using weeks`);
            }
            return `0 0 */${value} * *`;

        case 'w': // Weeks (run every N weeks on Sunday)
            return `0 0 * * 0`;

        default:
            return null;
    }
};

/**
 * Parse daily time to cron expression
 * 
 * @param {string} time - e.g. "09:00", "14:30"
 * @returns {string|null} Cron expression or null if invalid
 */
const parseDailyToCron = (time) => {
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
    }

    return `${minute} ${hour} * * *`;
};

/**
 * Convert trigger JSON to cron expression
 * 
 * @param {Object} trigger - Trigger configuration
 * @returns {Object} { valid: boolean, cron: string|null, error: string|null }
 */
export const triggerToCron = (trigger) => {
    if (!trigger || typeof trigger !== 'object') {
        return { valid: false, cron: null, error: 'Invalid trigger object' };
    }

    const { type } = trigger;

    switch (type) {
        case 'interval': {
            const cron = parseIntervalToCron(trigger.every);
            if (!cron) {
                return { valid: false, cron: null, error: `Invalid interval: ${trigger.every}` };
            }
            logger.debug('Parsed interval trigger', { interval: trigger.every, cron });
            return { valid: true, cron, error: null };
        }

        case 'daily': {
            const cron = parseDailyToCron(trigger.at);
            if (!cron) {
                return { valid: false, cron: null, error: `Invalid daily time: ${trigger.at}` };
            }
            logger.debug('Parsed daily trigger', { time: trigger.at, cron });
            return { valid: true, cron, error: null };
        }

        case 'manual':
            // Manual triggers don't have cron
            return { valid: true, cron: null, error: null };

        case 'webhook':
            // Webhook triggers are event-driven, no cron needed
            return { valid: true, cron: null, error: null };

        case 'rss': {
            // RSS triggers use their own polling interval (handled by rssPoller)
            // Parse the interval for validation, but actual scheduling is done by rssPoller
            const interval = trigger.interval || '15m';
            const cronExpr = parseIntervalToCron(interval);
            if (!cronExpr) {
                return { valid: false, cron: null, error: `Invalid RSS poll interval: ${interval}` };
            }
            logger.debug('Parsed RSS trigger', { interval, cron: cronExpr });
            return { valid: true, cron: cronExpr, error: null };
        }

        default:
            return { valid: false, cron: null, error: `Unsupported trigger type: ${type}` };
    }
};

/**
 * Check if trigger is schedulable (not manual)
 */
export const isSchedulable = (trigger) => {
    return trigger && trigger.type && trigger.type !== 'manual';
};

export default { triggerToCron, isSchedulable };
