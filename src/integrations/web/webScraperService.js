/**
 * Web Scraper Service
 * Production-grade unified scraper with adapter pattern
 */

import logger from '../../utils/logger.js';
import githubAdapter from './adapters/githubAdapter.js';
import hackerNewsAdapter from './adapters/hackerNewsAdapter.js';
import redditAdapter from './adapters/redditAdapter.js';
import screenerAdapter from './adapters/screenerAdapter.js';
import { growwAdapter } from './adapters/growwAdapter.js';
import hack2SkillAdapter from './adapters/hack2SkillAdapter.js';
import twitterAdapter from './adapters/twitterAdapter.js';

const ADAPTERS = {
    github: githubAdapter,
    hackernews: hackerNewsAdapter,
    reddit: redditAdapter,
    screener: screenerAdapter,
    groww: growwAdapter,
    hack2skill: hack2SkillAdapter,
    twitter: twitterAdapter
};

export const scrapeWeb = async (provider, params) => {
    const adapter = ADAPTERS[provider.toLowerCase()];

    if (!adapter) {
        throw new Error(`Unsupported provider: ${provider}. Available: ${Object.keys(ADAPTERS).join(', ')}`);
    }

    logger.info('Scraping web', { provider, params });

    const data = await adapter.fetch(params);

    logger.info('Successfully scraped web', {
        provider,
        items: data.items?.length || 0
    });

    return {
        provider,
        success: true,
        data,
        timestamp: new Date().toISOString()
    };
};

export const formatDigest = async (provider, data) => {
    const adapter = ADAPTERS[provider.toLowerCase()];

    if (!adapter || !adapter.formatDigest) {
        return JSON.stringify(data, null, 2);
    }

    return adapter.formatDigest(data);
};

export default {
    scrapeWeb,
    formatDigest,
    getSupportedProviders: () => Object.keys(ADAPTERS)
};
