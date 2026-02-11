
import screenerAdapter from '../integrations/web/adapters/screenerAdapter.js';
import logger from '../utils/logger.js';

// Mock logger
logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;

const testScrape = async () => {
    try {
        console.log('Testing Screener Adapter for COASTCORP...');
        const result = await screenerAdapter.fetch({ symbol: 'COASTCORP' });

        console.log('--- Extracted Items ---');
        result.items.forEach((item, index) => {
            console.log(`[${index}] Title: ${item.title.substring(0, 50)}...`);
            console.log(`    Link:  ${item.link}`);
            if (item.link.includes('corp-announcements')) {
                console.error('    FAIL: Found generic "All" link instead of PDF!');
            }
        });

    } catch (error) {
        console.error('Scrape failed:', error);
    }
};

testScrape();
