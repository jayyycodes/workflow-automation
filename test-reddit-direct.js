// Test Reddit adapter directly
import redditAdapter from './src/integrations/web/adapters/redditAdapter.js';

async function test() {
    try {
        console.log('Testing Reddit adapter...');
        const result = await redditAdapter.fetch({
            subreddit: 'programming',
            sort: 'hot',
            limit: 5
        });
        console.log('✅ Success! Got', result.items.length, 'posts');
        console.log('First post:', result.items[0].title);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

test();
