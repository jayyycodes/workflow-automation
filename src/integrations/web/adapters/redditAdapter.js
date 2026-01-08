/**
 * Reddit Adapter
 * Uses Reddit's public JSON API (no authentication required!)
 */

import axios from 'axios';
import logger from '../../../utils/logger.js';

const fetch = async (params) => {
    const { subreddit, sort = 'hot', limit = 10 } = params;

    if (!subreddit) {
        throw new Error('Subreddit name is required');
    }

    // Reddit's public JSON API - just add .json to any URL!
    const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;

    logger.info('Fetching from Reddit API', { subreddit, sort, limit });

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'SmartWorkflowAutomation/1.0'
            },
            timeout: 10000
        });

        const posts = response.data.data.children;

        return {
            subreddit,
            sort,
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
        logger.error('Reddit API error', { error: error.message, subreddit });
        throw new Error(`Failed to fetch from Reddit: ${error.message}`);
    }
};

const formatDigest = (data) => {
    const { subreddit, sort, items } = data;

    let digest = `📱 Top ${sort} posts from r/${subreddit}\n\n`;

    items.forEach((post, i) => {
        digest += `${i + 1}. ${post.title}\n`;
        digest += `   ⬆️ ${post.score} points | 💬 ${post.comments} comments\n`;
        digest += `   👤 Posted by u/${post.author}\n`;
        digest += `   🔗 ${post.url}\n\n`;
    });

    digest += `\n---\nPowered by Smart Workflow Automation`;

    return digest;
};

export default { fetch, formatDigest };
