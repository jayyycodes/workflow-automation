/**
 * GitHub Adapter
 * FIXED: Using repo_type instead of type to avoid parameter collision
 */

import axios from 'axios';
import logger from '../../../utils/logger.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional - higher rate limits

const fetch = async (params) => {
    const { username, repo_type = 'stars' } = params;

    if (!username) {
        throw new Error('GitHub username required');
    }

    const endpoints = {
        stars: `/users/${username}/starred`,
        repos: `/users/${username}/repos`,
        activity: `/users/${username}/events/public`
    };

    const endpoint = endpoints[repo_type];
    if (!endpoint) {
        throw new Error(`Invalid repo_type: ${repo_type}. Use: stars, repos, activity`);
    }

    const headers = GITHUB_TOKEN ? {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    } : {
        'Accept': 'application/vnd.github.v3+json'
    };

    logger.info('Fetching from GitHub API', { username, repo_type });

    const response = await axios.get(`https://api.github.com${endpoint}`, {
        headers,
        params: { per_page: 20, sort: 'created' },
        timeout: 10000
    });

    return {
        username,
        repo_type,
        items: response.data.map(item => ({
            name: item.full_name || item.name,
            description: item.description,
            stars: item.stargazers_count,
            language: item.language,
            url: item.html_url,
            topics: item.topics || [],
            created_at: item.created_at
        })),
        total: response.data.length
    };
};

const formatDigest = (data) => {
    const { username, repo_type, items } = data;

    let digest = `📊 GitHub ${repo_type.toUpperCase()} for @${username}\n\n`;
    digest += `Found ${items.length} repositories!\n\n`;

    items.forEach((repo, i) => {
        digest += `${i + 1}. ${repo.name}\n`;
        digest += `   ⭐ ${repo.stars || 0} stars | 💻 ${repo.language || 'Unknown'}\n`;
        digest += `   ${repo.description || 'No description'}\n`;
        digest += `   🔗 ${repo.url}\n\n`;
    });

    return digest;
};

export default { fetch, formatDigest };
