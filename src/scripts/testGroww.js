
import { scrapeWeb } from '../integrations/web/webScraperService.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

// Mock logger
logger.info = console.log;
logger.error = console.error;
logger.warn = console.warn;

const testGroww = async () => {
    try {
        console.log('Testing Groww Scraper...');

        // Option 1: Live fetch (might look different than my debug cache if dynamic? Groww is Next.js, mostly SSR)
        // Let's rely on the real service which fetches URL.
        const result = await scrapeWeb('https://groww.in/gold-rates');

        console.log('\n--- Scrape Result ---');
        console.log(JSON.stringify(result, null, 2));

        if (result.items && result.items.length > 0 && result.items[0].price) {
            console.log(`\n[SUCCESS] Extracted Price: ${result.items[0].price}`);
        } else {
            console.log('\n[FAILURE] Price extraction failed.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
};

testGroww();
