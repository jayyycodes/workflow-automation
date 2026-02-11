
import fs from 'fs';
import screenerAdapter from '../integrations/web/adapters/screenerAdapter.js';
import logger from '../utils/logger.js';

// Mock logger
logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;

const testScrape = async () => {
    try {
        console.log('Testing Screener Adapter for HCLTECH (Filtering Check)...');
        const result = await screenerAdapter.fetch({ symbol: 'HCLTECH' });
        console.log('Result Items:', JSON.stringify(result.items, null, 2));

        // Check for premium links
        const hasPremium = result.items.some(item => item.link.includes('premium'));
        if (hasPremium) {
            console.error('FAIL: Premium link found!');
        } else {
            console.log('PASS: No premium links found.');
        }

    } catch (error) {
        console.error('Scrape failed FULL ERROR:', error);
        if (error.stack) console.error(error.stack);
    }
};

testScrape();
