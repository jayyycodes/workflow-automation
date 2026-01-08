/**
 * Reddit Adapter
 * Uses Reddit's public JSON API (no authentication required!)
 */

import axios from 'axios';
import logger from '../../../utils/logger.js';

const fetch = async (params) => {
    let { subreddit, sort = 'hot', limit = 10, keyword } = params;

    if (!subreddit) {
        throw new Error('Subreddit name is required');
    }

    // Strip "r/" prefix if AI included it
    subreddit = subreddit.replace(/^r\//, '');

    // Reddit's public JSON API - just add .json to any URL!
    const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit * 2}`; // Fetch more for filtering

    logger.info('Fetching from Reddit API', { subreddit, sort, limit, keyword });

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'SmartWorkflowAutomation/1.0'
            },
            timeout: 10000
        });

        let posts = response.data.data.children;

        // Filter by keyword if provided
        if (keyword) {
            const keywordLower = keyword.toLowerCase();
            posts = posts.filter(post => {
                const title = post.data.title.toLowerCase();
                const selftext = (post.data.selftext || '').toLowerCase();
                return title.includes(keywordLower) || selftext.includes(keywordLower);
            });
            logger.info(`Filtered posts by keyword "${keyword}"`, { matchedPosts: posts.length });
        }

        // Limit to requested count after filtering
        posts = posts.slice(0, limit);

        return {
            subreddit,
            sort,
            keyword: keyword || null,
            items: posts.map(post => ({
                title: post.data.title,
                author: post.data.author,
                score: post.data.score,
                comments: post.data.num_comments,
                url: `https://reddit.com${post.data.permalink}`,
                external_url: post.data.url,
                subreddit: post.data.subreddit,
                created: new Date(post.data.created_utc * 1000).toISOString(),
                is_self: post.data.is_self,
                selftext: post.data.selftext?.substring(0, 200) || ''
            })),
            total: posts.length
        };
    } catch (error) {
        logger.error('Reddit API error', {
            error: error.message,
            subreddit,
            url: `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`,
            statusCode: error.response?.status,
            statusText: error.response?.statusText
        });
        throw new Error(`Failed to fetch from Reddit: ${error.message}`);
    }
};

const formatDigest = (data) => {
    const { subreddit, sort, keyword, items } = data;

    let digest = `📱 Reddit ${sort.toUpperCase()} Posts from r/${subreddit}`;
    if (keyword) {
        digest += ` (filtered by: "${keyword}")`;
    }
    digest += `\n`;
    digest += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    items.forEach((post, i) => {
        digest += `${i + 1}. ${post.title}\n`;
        digest += `   👤 u/${post.author} | ⬆️ ${post.score} points | 💬 ${post.comments} comments\n`;

        // Add preview of selftext if available
        if (post.is_self && post.selftext) {
            const preview = post.selftext.substring(0, 100);
            digest += `   📝 ${preview}${post.selftext.length > 100 ? '...' : ''}\n`;
        }

        digest += `   🔗 ${post.url}\n`;
        digest += `\n`;
    });

    digest += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    digest += `📊 Found ${items.length} posts\n`;
    digest += `Powered by Smart Workflow Automation`;

    return digest;
};

export default { fetch, formatDigest };
