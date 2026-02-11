
import twitterAdapter from '../integrations/web/adapters/twitterAdapter.js';

const runTest = async () => {
    const usernames = ['nikhilkamathcio', 'rajshamani', 'elonmusk'];

    for (const user of usernames) {
        console.log(`\nTesting @${user}...`);
        try {
            const result = await twitterAdapter.fetch({ username: user, limit: 3 });
            console.log("Result type:", typeof result);
            console.log("Output summary:", result.substring(0, 100) + "...");
        } catch (error) {
            console.error("Test failed:", error.message);
        }
    }
};

runTest();
