
import aiBridgeService from './src/services/aiBridgeService.js';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    console.log("Testing Twitter Research Bridge...");
    const result = await aiBridgeService.researchTwitter('rajshamani');
    console.log("Result:", JSON.stringify(result, null, 2));
};

test();
