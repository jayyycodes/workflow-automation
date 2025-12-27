/**
 * HackerNews Adapter
 * Public API - no auth needed
 * FIXED: Using story_type instead of type to avoid parameter collision  
 */

import axios from 'axios';
import logger from '../../../utils/logger.js';

const fetch = async (params) => {
    const { story_type = 'top', count = 10 } = params;

    const validTypes = ['top', 'best', 'new'];
    if (!validTypes.includes(story_type)) {
        throw new Error(`Invalid story_type: ${story_type}. Use: ${validTypes.join(', ')}`);
    }

    logger.info('Fetching from HackerNews API', { story_type, count });

    // Get story IDs
    const idsUrl = `https://hacker-news.firebaseio.com/v0/${story_type}stories.json`;
    const { data: ids } = await axios.get(idsUrl, { timeout: 5000 });

    // Fetch top stories
    const stories = await Promise.all(
        ids.slice(0, count).map(async (id) => {
            const { data } = await axios.get(
                `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
                { timeout: 5000 }
            );
            return data;
        })
    );

    return {
        story_type,
        items: stories.filter(s => s).map(story => ({
            title: story.title,
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            score: story.score,
            author: story.by,
            comments: story.descendants || 0,
            time: new Date(story.time * 1000).toISOString()
        })),
        total: stories.length
    };
};

const formatDigest = (data) => {
    const { story_type, items } = data;

    let digest = `🔥 HackerNews ${story_type.toUpperCase()} Stories\n\n`;

    items.forEach((story, i) => {
        digest += `${i + 1}. ${story.title}\n`;
        digest += `   ⬆️ ${story.score} points | 💬 ${story.comments} comments\n`;
        digest += `   👤 ${story.author}\n`;
        digest += `   🔗 ${story.url}\n\n`;
    });

    return digest;
};

export default { fetch, formatDigest };
