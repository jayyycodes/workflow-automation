/**
 * HackerNews Adapter
 * Public API - no auth needed
 * FIXED: Using story_type instead of type to avoid parameter collision  
 */

import axios from 'axios';
import logger from '../../../utils/logger.js';

const fetch = async (params) => {
    const { story_type = 'top', count = 10, keyword } = params;

    const validTypes = ['top', 'best', 'new'];
    if (!validTypes.includes(story_type)) {
        throw new Error(`Invalid story_type: ${story_type}. Use: ${validTypes.join(', ')}`);
    }

    logger.info('Fetching from HackerNews API', { story_type, count, keyword });

    // If keyword filtering, fetch more stories to ensure we get enough matches
    const fetchCount = keyword ? count * 3 : count;

    // Get story IDs
    const idsUrl = `https://hacker-news.firebaseio.com/v0/${story_type}stories.json`;
    const { data: ids } = await axios.get(idsUrl, { timeout: 5000 });

    // Fetch stories
    const stories = await Promise.all(
        ids.slice(0, fetchCount).map(async (id) => {
            const { data } = await axios.get(
                `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
                { timeout: 5000 }
            );
            return data;
        })
    );

    // Filter stories if keyword provided
    let filteredStories = stories.filter(s => s);

    if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        filteredStories = filteredStories.filter(story =>
            story.title?.toLowerCase().includes(lowerKeyword)
        );

        logger.info('Keyword filtering applied', {
            keyword,
            originalCount: stories.length,
            filteredCount: filteredStories.length
        });
    }

    // Limit to requested count
    filteredStories = filteredStories.slice(0, count);

    return {
        story_type,
        keyword: keyword || null,
        items: filteredStories.map(story => ({
            title: story.title,
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            score: story.score,
            author: story.by,
            comments: story.descendants || 0,
            time: new Date(story.time * 1000).toISOString()
        })),
        total: filteredStories.length
    };
};

const formatDigest = (data) => {
    const { story_type, items, keyword } = data;

    let digest = `🔥 HackerNews ${story_type.toUpperCase()} Stories`;
    if (keyword) {
        digest += ` (filtered by "${keyword}")`;
    }
    digest += `\n\n`;

    items.forEach((story, i) => {
        digest += `${i + 1}. ${story.title}\n`;
        digest += `   ⬆️ ${story.score} points | 💬 ${story.comments} comments\n`;
        digest += `   👤 ${story.author}\n`;
        digest += `   🔗 ${story.url}\n\n`;
    });

    return digest;
};

export default { fetch, formatDigest };
