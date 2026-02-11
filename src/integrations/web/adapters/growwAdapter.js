
import logger from '../../../utils/logger.js';

/**
 * Adapter for scraping Gold Rates from Groww.in
 */
export const growwAdapter = {
    /**
     * Check if this adapter can handle the given URL
     */
    canHandle: (url) => {
        return url.includes('groww.in/gold-rates');
    },

    /**
     * Fetch and Scrape Gold Rates
     * @param {Object} params - { url: 'https://groww.in/gold-rates' }
     */
    fetch: async (params) => {
        const url = params.url || 'https://groww.in/gold-rates';

        try {
            logger.info(`Fetching Gold Rates from ${url}`);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Groww fetch failed: ${response.status}`);
            }

            const html = await response.text();

            // Regex to find 24K Gold / 10gm price
            // Looks for "24K Gold.../ 10gm" container, then finds the Price starting with ₹
            // HTML pattern: <span>24K<!-- --> Gold</span><span> / 10gm</span> ... <span class="">₹</span><span class="bodyLarge">151437.90     </span>

            const priceRegex = /24K.*?Gold.*?\/.*?10gm[\s\S]*?₹<\/span><span[^>]*>([\d,]+\.?\d*)/i;
            const dateRegex = /24K.*?Gold.*?\/.*?10gm[\s\S]*?class="contentSecondary[^>]*>([^<]+)/i;

            const priceMatch = html.match(priceRegex);
            const dateMatch = html.match(dateRegex);

            if (!priceMatch) {
                logger.warn('Groww scraper: Could not find 24K Gold price pattern');
                return {
                    title: 'Gold Rate (Groww)',
                    items: [],
                    error: 'Price not found'
                };
            }

            const price = priceMatch[1].trim();
            const date = dateMatch ? dateMatch[1].trim() : 'Unknown Date';

            logger.info('Groww scraper found price', { price, date });

            return {
                title: 'Gold Rate Update (Groww)',
                description: `24K Gold Rate: ₹${price} / 10gm`,
                items: [{
                    title: '24K Gold / 10gm',
                    price: price,
                    currency: 'INR',
                    date: date,
                    link: url
                }]
            };

        } catch (error) {
            logger.error('Error scraping Groww', { error: error.message });
            throw error;
        }
    },

    /**
     * Format the scraped data for notifications
     */
    formatDigest: (data) => {
        if (!data.items || data.items.length === 0) {
            return "Could not fetch Gold Rates from Groww.";
        }
        const item = data.items[0];
        return `🏅 *Gold Rate Update (Groww)*\n\n` +
            `💰 *24K Gold / 10gm:* ₹${item.price}\n` +
            `📅 *Date:* ${item.date}\n` +
            `🔗 [View Details](${item.link})`;
    }
};
