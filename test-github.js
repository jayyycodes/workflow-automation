// Quick GitHub scraper test script
import webScraper from './src/integrations/web/webScraperService.js';

async function testGitHub() {
    console.log('Testing GitHub scraper...');
    try {
        const result = await webScraper.scrapeWeb('github', {
            username: 'torvalds',  // Test with Linus's GitHub
            repo_type: 'repos'
        });
        console.log('✅ Success!', JSON.stringify(result, null, 2));
        const digest = await webScraper.formatDigest('github', result.data);
        console.log('Digest:', digest);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testGitHub();
