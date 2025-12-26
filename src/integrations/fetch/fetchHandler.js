/**
 * Generic Fetch Data Handler
 * 
 * Single entry point for all fetch operations.
 * Routes to appropriate provider based on params.
 */

import logger from '../../utils/logger.js';

/**
 * Market data providers
 */
const marketProviders = {
    /**
     * Yahoo Finance (Free, no API key needed!)
     */
    yahoo: async (identifier) => {
        // Auto-format Indian stocks - add .NS (NSE) if no exchange suffix
        let symbol = identifier.toUpperCase();

        // Common Indian stocks that need .NS or .BO suffix
        const indianStocks = ['SBIN', 'RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICI', 'BAJAJ', 'WIPRO', 'ONGC', 'TATA'];
        const isIndianStock = indianStocks.some(stock => symbol.startsWith(stock)) && !symbol.includes('.');

        if (isIndianStock) {
            symbol = `${symbol}.NS`; // Add NSE exchange suffix
            logger.info(`Auto-formatted Indian stock: ${identifier} → ${symbol}`);
        }

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.status}`);
        }

        const data = await response.json();
        const quote = data?.chart?.result?.[0];

        if (!quote) {
            throw new Error(`No data found for ${symbol}`);
        }

        const meta = quote.meta;
        const price = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose;
        const change = price - previousClose;
        const changePercent = ((change / previousClose) * 100).toFixed(2);

        return {
            symbol: identifier,
            price: price.toFixed(2),
            change: change.toFixed(2),
            changePercent: `${changePercent}%`,
            currency: meta.currency,
            marketState: meta.marketState,
            timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
        };
    },

    /**
     * Finnhub (requires API key)
     */
    finnhub: async (identifier, apiKey) => {
        if (!apiKey) {
            throw new Error('Finnhub API key required');
        }

        const url = `https://finnhub.io/api/v1/quote?symbol=${identifier}&token=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            symbol: identifier,
            price: data.c.toFixed(2),
            change: (data.c - data.pc).toFixed(2),
            changePercent: `${data.dp}%`,
            high: data.h,
            low: data.l,
            timestamp: new Date(data.t * 1000).toISOString()
        };
    }
};

/**
 * Crypto providers
 */
const cryptoProviders = {
    /**
     * CoinGecko (Free, no API key!)
     */
    coingecko: async (identifier) => {
        const coinMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'SOL': 'solana',
            'USDT': 'tether'
        };

        const coinId = coinMap[identifier.toUpperCase()] || identifier.toLowerCase();
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        const priceData = data[coinId];

        if (!priceData) {
            throw new Error(`Crypto ${identifier} not found`);
        }

        return {
            symbol: identifier.toUpperCase(),
            price: priceData.usd.toFixed(2),
            change24h: priceData.usd_24h_change?.toFixed(2) || '0.00',
            changePercent: `${priceData.usd_24h_change?.toFixed(2) || '0.00'}%`,
            provider: 'coingecko',
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Generic Fetch Data Handler
 * 
 * @param {Object} params - Step parameters
 * @param {string} params.source - Data source type ('market', 'crypto', 'jobs', etc.)
 * @param {string} params.identifier - What to fetch (symbol, query, etc.)
 * @param {string} params.provider - Which provider to use (optional, auto-selects)
 * @param {Object} context - Execution context
 */
export const fetchData = async (params, context) => {
    const { source, identifier, provider, apiKey } = params;

    logger.info(`Fetching ${source} data`, { identifier, provider });

    try {
        switch (source) {
            case 'market':
            case 'stock':
                // Default to Yahoo Finance (free, no key needed)
                const selectedMarketProvider = provider || 'yahoo';

                if (!marketProviders[selectedMarketProvider]) {
                    throw new Error(`Unknown market provider: ${selectedMarketProvider}`);
                }

                return await marketProviders[selectedMarketProvider](identifier, apiKey);

            case 'crypto':
                // Default to CoinGecko (free, no key needed)
                const selectedCryptoProvider = provider || 'coingecko';

                if (!cryptoProviders[selectedCryptoProvider]) {
                    throw new Error(`Unknown crypto provider: ${selectedCryptoProvider}`);
                }

                return await cryptoProviders[selectedCryptoProvider](identifier);

            default:
                throw new Error(`Unsupported source: ${source}. Supported: market, crypto`);
        }
    } catch (error) {
        logger.error('Fetch data failed', { source, identifier, error: error.message });
        throw error;
    }
};

/**
 * Backward compatibility: fetch_stock_price
 */
export const fetchStockPrice = async (params, context) => {
    return fetchData({
        source: 'market',
        identifier: params.symbol,
        provider: params.provider || 'yahoo',
        apiKey: params.apiKey
    }, context);
};

/**
 * Backward compatibility: fetch_crypto_price
 */
export const fetchCryptoPrice = async (params, context) => {
    return fetchData({
        source: 'crypto',
        identifier: params.symbol,
        provider: params.provider || 'coingecko'
    }, context);
};

export default {
    fetchData,
    fetchStockPrice,
    fetchCryptoPrice
};
