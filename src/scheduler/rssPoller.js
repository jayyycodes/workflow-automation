/**
 * RSS Poller
 * 
 * Polls RSS feeds at configured intervals for automations with rss triggers.
 * Detects new entries by tracking the latest seen guid/pubDate in Firestore.
 * When new items appear, triggers the associated workflow.
 * 
 * Design:
 * - Reuses existing node-cron pattern from scheduler.js
 * - Stores last-seen state in Firestore collection 'rss_poll_state'
 * - Integrates with workflowExecutor for workflow execution
 */

import cron from 'node-cron';
import { db } from '../config/firebase.js';
import { executeWorkflow } from '../automations/workflowExecutor.js';
import logger from '../utils/logger.js';
import { fetchRssFeed } from '../integrations/rss/rssFeedHandler.js';

// Active RSS polling jobs: automationId -> cronTask
const rssJobs = new Map();

/**
 * Schedule an RSS polling job for an automation.
 * 
 * @param {Object} automation - Automation object with rss trigger
 * @returns {boolean} Whether scheduling was successful
 */
export const scheduleRssPoller = (automation) => {
    const trigger = typeof automation.trigger === 'string'
        ? JSON.parse(automation.trigger)
        : automation.trigger;

    if (trigger.type !== 'rss') return false;

    const feedUrl = trigger.url;
    if (!feedUrl) {
        logger.error('RSS trigger missing "url"', { automationId: automation.id });
        return false;
    }

    // Default interval: 15 minutes
    const interval = trigger.interval || '15m';
    const cronExpression = intervalToCron(interval);
    if (!cronExpression) {
        logger.error('Invalid RSS poll interval', { interval, automationId: automation.id });
        return false;
    }

    // Remove existing job if any
    unscheduleRssPoller(automation.id);

    try {
        const task = cron.schedule(cronExpression, async () => {
            logger.info('📡 RSS poll triggered', {
                automationId: automation.id,
                feedUrl,
                name: automation.name
            });
            await pollAndTrigger(automation, feedUrl);
        });

        rssJobs.set(automation.id, task);
        logger.info('✅ RSS poller scheduled', {
            automationId: automation.id,
            feedUrl,
            interval,
            cron: cronExpression
        });

        return true;
    } catch (err) {
        logger.error('Failed to schedule RSS poller', {
            automationId: automation.id,
            error: err.message
        });
        return false;
    }
};

/**
 * Unschedule an RSS polling job.
 */
export const unscheduleRssPoller = (automationId) => {
    if (rssJobs.has(automationId)) {
        rssJobs.get(automationId).stop();
        rssJobs.delete(automationId);
        logger.info('🛑 RSS poller stopped', { automationId });
    }
};

/**
 * Poll a feed and trigger workflow if new items are found.
 */
async function pollAndTrigger(automation, feedUrl) {
    try {
        // Fetch the feed
        const feedResult = await fetchRssFeed({ url: feedUrl, limit: 20 });

        if (!feedResult.items?.length) {
            logger.debug('RSS feed empty, skipping', { feedUrl });
            return;
        }

        // Get last-seen state from Firestore
        const stateRef = db.collection('rss_poll_state').doc(automation.id);
        const stateDoc = await stateRef.get();
        const lastState = stateDoc.exists ? stateDoc.data() : null;
        const lastSeenGuids = lastState?.seenGuids || [];
        const lastPollTime = lastState?.lastPollTime || null;

        // Find new items (not in last-seen set)
        const newItems = feedResult.items.filter(item => {
            const guid = item.guid || item.link || item.title;
            if (lastSeenGuids.includes(guid)) return false;

            // Also check by pubDate if we have a lastPollTime
            if (lastPollTime && item.pubDate) {
                return new Date(item.pubDate) > new Date(lastPollTime);
            }
            return true;
        });

        if (newItems.length === 0) {
            logger.debug('No new RSS items', { feedUrl, totalItems: feedResult.items.length });
            // Update poll time even if no new items
            await stateRef.set({
                lastPollTime: new Date().toISOString(),
                seenGuids: feedResult.items.map(i => i.guid || i.link || i.title).slice(0, 100),
                feedUrl
            }, { merge: true });
            return;
        }

        logger.info(`📡 ${newItems.length} new RSS items found`, {
            automationId: automation.id,
            feedUrl,
            newCount: newItems.length
        });

        // Update seen state BEFORE triggering (prevent duplicate triggers)
        await stateRef.set({
            lastPollTime: new Date().toISOString(),
            seenGuids: feedResult.items.map(i => i.guid || i.link || i.title).slice(0, 100),
            feedUrl,
            lastNewItemCount: newItems.length
        });

        // Create execution record
        const execRef = await db.collection('executions').add({
            automationId: automation.id,
            input: {
                triggeredBy: 'rss_poller',
                feedUrl,
                newItemCount: newItems.length,
                scheduledAt: new Date().toISOString()
            },
            status: 'PENDING',
            created_at: new Date().toISOString()
        });

        // Fetch user for personalized notifications
        const userDoc = await db.collection('users').doc(automation.user_id).get();
        const user = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;

        // Execute workflow with RSS data injected into context
        const result = await executeWorkflow(
            {
                ...automation,
                _rssData: { feed: feedResult, newItems }
            },
            execRef.id,
            user
        );

        logger.info('✅ RSS-triggered execution completed', {
            automationId: automation.id,
            executionId: execRef.id,
            status: result.status,
            newItems: newItems.length
        });

    } catch (error) {
        logger.error('❌ RSS poll/trigger failed', {
            automationId: automation.id,
            feedUrl,
            error: error.message
        });
    }
}

/**
 * Convert simple interval string to cron expression.
 */
function intervalToCron(interval) {
    const match = interval.match(/^(\d+)(m|h|d)$/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 'm': return `*/${value} * * * *`;
        case 'h': return `0 */${value} * * *`;
        case 'd': return `0 0 */${value} * *`;
        default: return null;
    }
}

/**
 * Get RSS poller statistics.
 */
export const getRssPollerStats = () => ({
    activePollers: rssJobs.size,
    pollerIds: Array.from(rssJobs.keys())
});

/**
 * Stop all RSS pollers.
 */
export const stopAllRssPollers = () => {
    for (const [id, job] of rssJobs.entries()) {
        job.stop();
    }
    const count = rssJobs.size;
    rssJobs.clear();
    logger.info(`Stopped ${count} RSS pollers`);
    return count;
};

export default {
    scheduleRssPoller,
    unscheduleRssPoller,
    getRssPollerStats,
    stopAllRssPollers
};
