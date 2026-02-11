
const hack2SkillAdapter = {
    fetch: async (params) => {
        const url = typeof params === 'string' ? params : (params.url || 'https://hack2skill.com/');
        const limit = (typeof params === 'object' && params.limit) ? parseInt(params.limit) : null;

        try {
            console.log(`[Hack2Skill] Fetching ${url} (Limit: ${limit || 'None'})`);

            // Add headers to mimic browser
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            };

            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();

            console.log(`[Hack2Skill] Fetched ${html.length} bytes`);

            // Regex to isolate card blocks. 
            // We look for the image class 'boxShadowCardImage' as a reliable anchor for each card.
            // Then we scan foward to find title, date, and link.

            const challenges = [];

            // Split html by "boxShadowCardImage" to get rough chunks for each card
            const cards = html.split('boxShadowCardImage');

            // Skip the first chunk (header stuff)
            for (let i = 1; i < cards.length; i++) {
                const cardHtml = cards[i];

                // Extract Title (h5 right after the image block)
                const titleMatch = cardHtml.match(/<h5[^>]*title="([^"]+)"/);
                const title = titleMatch ? titleMatch[1] : 'Unknown Challenge';

                // Extract Date (Look for "Registration Ends on" then the next h5)
                const dateMatch = cardHtml.match(/Registration Ends on[\s\S]*?<h5[^>]*>([\s\S]*?)<\/h5>/);
                const date = dateMatch ? dateMatch[1].trim() : 'Date not found';

                // Extract Link
                const linkMatch = cardHtml.match(/href="([^"]+)"/);
                const link = linkMatch ? linkMatch[1] : null;

                // Extract Status (Button text)
                // We limit the search range to avoid bleeding into next card
                const buttonSection = cardHtml.substring(0, 3000);
                const buttonTextMatch = buttonSection.match(/>\s*(Registration closed|Register Now|Apply Now|View Details)\s*<\/a>/i);

                let status = 'Unknown';
                if (buttonTextMatch) {
                    status = buttonTextMatch[1].trim();
                } else if (buttonSection.includes('Registration closed')) {
                    status = 'Registration closed';
                } else {
                    // Fallback check
                    status = 'Open';
                }

                if (link && !link.startsWith('http')) {
                    // Handle relative links if any (though source showed absolute)
                }

                // Filter: Only add if it looks like a valid card
                if (title !== 'Unknown Challenge') {
                    challenges.push({
                        title,
                        date,
                        link,
                        status,
                        price: "Free" // Most seem free
                    });
                }
            }

            // Filter for OPEN hackathons
            let openChallenges = challenges.filter(c =>
                !c.status.toLowerCase().includes('closed')
            );

            if (limit && limit > 0) {
                console.log(`[Hack2Skill] Limiting results to top ${limit}`);
                openChallenges = openChallenges.slice(0, limit);
            }

            console.log(`[Hack2Skill] Found ${challenges.length} total, returning ${openChallenges.length} open.`);

            if (openChallenges.length === 0) {
                return "No open hackathons found at the moment on Hack2Skill.";
            }

            const header = `_Generated on: ${new Date().toLocaleString()}_\n\n`;

            return header + openChallenges.map(c =>
                `🏆 **${c.title}**\n📅 Ends: ${c.date}\n🔗 [View Challenge](${c.link})\n`
            ).join('\n');

        } catch (error) {
            console.error('[Hack2Skill] Error:', error);
            return `Failed to fetch Hack2Skill data. Error: ${error.message}`;
        }
    },

    formatDigest: (data) => {
        return data; // Fetch already returns formatted string
    }
};

export default hack2SkillAdapter;
