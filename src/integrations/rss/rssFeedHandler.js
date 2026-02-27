/**
 * RSS Feed Handler
 * 
 * Fetches and parses RSS/Atom feeds.
 * Features:
 * - Supports RSS 2.0 and Atom feeds
 * - Configurable item limit
 * - Content sanitization (strips HTML)
 * - ContextMemory & executionLogger compatible
 */

import Parser from 'rss-parser';
import logger from '../../utils/logger.js';

const parser = new Parser({
    timeout: 15000,
    headers: {
        'User-Agent': 'SmartWorkflow-Automation/1.0',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml'
    },
    maxRedirects: 5,
    customFields: {
        item: ['media:content', 'media:thumbnail', 'dc:creator']
    }
});

/**
 * Strip HTML tags from text.
 */
function stripHtml(html) {
    if (!html || typeof html !== 'string') return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Fetch and parse an RSS/Atom feed.
 * 
 * @param {Object} params
 * @param {string} params.url - RSS/Atom feed URL
 * @param {number} [params.limit] - Maximum number of items to return (default: 10)
 * @param {Object} context - Execution context
 * @returns {Object} Parsed feed data
 */
export const fetchRssFeed = async (params, context) => {
    const { url, limit = 10 } = params;

    if (!url) {
        throw new Error('fetch_rss_feed: "url" parameter is required');
    }

    logger.info('📡 Fetching RSS feed', { url, limit });

    const startTime = Date.now();

    try {
        const feed = await parser.parseURL(url);
        const duration = Date.now() - startTime;

        // Process and limit items
        const items = (feed.items || []).slice(0, limit).map(item => ({
            title: item.title || 'Untitled',
            link: item.link || '',
            pubDate: item.pubDate || item.isoDate || null,
            content: stripHtml(item.contentSnippet || item.content || item.summary || '').substring(0, 500),
            author: item.creator || item['dc:creator'] || item.author || 'Unknown',
            guid: item.guid || item.id || item.link || '',
            categories: item.categories || []
        }));

        const result = {
            title: feed.title || 'Untitled Feed',
            description: feed.description || '',
            link: feed.link || url,
            feedUrl: url,
            items,
            itemCount: items.length,
            totalAvailable: (feed.items || []).length,
            lastBuildDate: feed.lastBuildDate || null,
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };

        logger.info('✅ RSS feed parsed', {
            title: result.title,
            items: result.itemCount,
            duration_ms: duration
        });

        return result;

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('❌ RSS feed fetch failed', {
            url,
            error: error.message,
            duration_ms: duration
        });

        throw new Error(`fetch_rss_feed failed for "${url}": ${error.message}`);
    }
};

/**
 * Format RSS feed items into a readable digest.
 */
export const formatRssDigest = (feedResult) => {
    if (!feedResult || !feedResult.items?.length) {
        return 'No RSS items found.';
    }

    let digest = `📡 ${feedResult.title}\n${'═'.repeat(40)}\n\n`;

    feedResult.items.forEach((item, i) => {
        digest += `${i + 1}. ${item.title}\n`;
        if (item.link) digest += `   🔗 ${item.link}\n`;
        if (item.pubDate) digest += `   📅 ${new Date(item.pubDate).toLocaleDateString()}\n`;
        if (item.content) {
            const snippet = item.content.substring(0, 150);
            digest += `   ${snippet}${item.content.length > 150 ? '...' : ''}\n`;
        }
        digest += '\n';
    });

    digest += `\n📊 ${feedResult.itemCount} items from ${feedResult.title}`;
    return digest;
};

export default fetchRssFeed;
