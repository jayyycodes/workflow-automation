/**
 * Screener.in Adapter
 * Scrapes annual reports and announcements from Screener.in
 */
import logger from '../../../utils/logger.js';

const BASE_URL = 'https://www.screener.in';

const screenerAdapter = {
    /**
     * Fetch announcements for a given symbol
     * @param {Object} params - { symbol: 'HCLTECH' }
     */
    fetch: async (params) => {
        const { symbol } = params;
        if (!symbol) throw new Error('Symbol is required for Screener.in scraping');

        const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
        const url = `${BASE_URL}/company/${cleanSymbol}/`;

        logger.info(`Fetching announcements from ${url}`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) throw new Error(`Stock ${cleanSymbol} not found on Screener.in`);
                throw new Error(`Screener.in fetch failed: ${response.status}`);
            }

            const html = await response.text();

            // Extract Announcements section
            // Look for "Announcements" and then list items
            // Regex approach since we don't have cheerio

            // 1. Find the start of the actual Announcements section (avoiding nav menu)
            // The header looks like <h3 ...>Announcements</h3>
            const announcementHeaderRegex = /<h3[^>]*>\s*Announcements\s*<\/h3>/i;
            const announcementMatch = html.match(announcementHeaderRegex);

            if (!announcementMatch) {
                logger.warn('No "Announcements" H3 header found');
                return { items: [] };
            }

            const announcementIndex = announcementMatch.index;

            // 2. Find the *list* of announcements specifically (skipping the "All" button)
            // The list is in a <ul class="list-links">
            const relevantSubstr = html.substring(announcementIndex, announcementIndex + 20000);

            const listStartRegex = /<ul\s+class=["']list-links["']>/i;
            const listMatch = relevantSubstr.match(listStartRegex);

            if (!listMatch) {
                logger.warn('No announcement list (ul.list-links) found after header');
                return { items: [] };
            }

            // Start extracting from the list start
            const listStartIndex = listMatch.index;
            const listHtml = relevantSubstr.substring(listStartIndex);

            // 3. Extract links explicitly from the list items
            // Matches: <a href="...">Title</a> date info </li>

            const items = [];
            const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)<\/li>/gi;

            let match;
            while ((match = linkRegex.exec(listHtml)) !== null) {
                if (items.length >= 5) break;

                let href = match[1];
                let title = match[2].replace(/<[^>]+>/g, '').trim();
                let dateInfo = match[3].replace(/<[^>]+>/g, '').trim();

                // Clean up title (Screener often puts newlines)
                title = title.replace(/\s+/g, ' ');

                // Fix relative links if any (though we saw absolute bseindia links)
                if (!href.startsWith('http')) {
                    href = `${BASE_URL}${href}`;
                }

                // Filter out irrelevant links (premium, login, register, etc.)
                if (href.includes('/premium/') || href.includes('/login/') || href.includes('/register/')) {
                    continue;
                }

                // If no date found in suffix, try finding it inside the title capture if regex was greedy
                // But simplified: just take what we found
                const date = dateInfo || 'Recent';

                items.push({
                    title,
                    link: href,
                    date,
                    source: 'Screener.in'
                });
            }

            if (items.length === 0) {
                // Fallback: Try a simpler regex that just looks for bseindia/nseindia links
                const fallbackRegex = /<a[^>]+href="([^"]+(?:bseindia|nseindia)[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
                while ((match = fallbackRegex.exec(listHtml)) !== null) {
                    if (items.length >= 5) break;
                    items.push({
                        title: match[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '),
                        link: match[1],
                        date: 'Recent',
                        source: 'Screener.in'
                    });
                }
            }

            return {
                symbol: cleanSymbol,
                url,
                items
            };

        } catch (error) {
            logger.error('Screener scraping failed', { symbol, error: error.message });
            throw error;
        }
    },

    /**
     * Format the data for email/notification
     */
    formatDigest: (data) => {
        if (!data.items || data.items.length === 0) {
            return `No recent announcements found for ${data.symbol || 'stock'}.`;
        }

        const header = `📢 Recent Announcements for ${data.symbol}`;
        const rows = data.items.map(item => {
            return `- [${item.date}] ${item.title}\n  🔗 ${item.link}`;
        }).join('\n\n');

        return `${header}\n\n${rows}\n\nSource: ${data.url}`;
    }
};

export default screenerAdapter;
