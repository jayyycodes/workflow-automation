
import fs from 'fs';
import path from 'path';

const debugHack2Skill = async () => {
    try {
        console.log('Fetching Hack2Skill homepage...');
        const response = await fetch('https://hack2skill.com/');
        const html = await response.text();

        console.log(`Fetched ${html.length} bytes.`);

        fs.writeFileSync('debug_hack2skill.html', html);
        console.log('Saved to debug_hack2skill.html');

    } catch (error) {
        console.error('Fetch failed:', error);
    }
};

debugHack2Skill();
