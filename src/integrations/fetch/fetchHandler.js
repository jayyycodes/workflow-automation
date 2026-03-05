/**
 * Generic Fetch Data Handler
 * 
 * Single entry point for all fetch operations.
 * Routes to appropriate provider based on params.
 */

import axios from 'axios';
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

        // 1. Handle Commodities (Map to Global Futures or Indian ETFs)
        const commodityMap = {
            'GOLD': 'GC=F',             // Gold Futures (USD)
            'GOLD_INR': 'GOLDBEES.NS',  // Nippon India ETF Gold BeES (INR)
            'SILVER': 'SI=F',           // Silver Futures (USD)
            'SILVER_INR': 'SILVERBEES.NS', // Nippon India ETF Silver BeES (INR)
            'NIFTY': '^NSEI',           // Nifty 50 Index
            'SENSEX': '^BSESN',         // Sensex Index
            'BANKNIFTY': '^NSEBANK'     // Bank Nifty
        };

        if (commodityMap[symbol]) {
            symbol = commodityMap[symbol];
            logger.info(`Mapped commodity/index: ${identifier} → ${symbol}`);
        } else {
            // 2. Handle Indian Stock Auto-discovery
            // List of common Indian stock prefixes (Nifty 50 + others) to auto-append .NS
            const indianStocks = [
                'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'HUL', 'ITC', 'SBIN',
                'BHARTIARTL', 'KOTAKBANK', 'LICI', 'LT', 'AXISBANK', 'ASIANPAINT', 'HCLTECH',
                'MARUTI', 'TITAN', 'BAJFINANCE', 'SUNPHARMA', 'ADANIENT', 'ADANIPORTS',
                'ULTRACEMCO', 'TATAMOTORS', 'NTPC', 'POWERGRID', 'TATASTEEL', 'WIPRO',
                'M&M', 'JSWSTEEL', 'GRASIM', 'LTIM', 'ONGC', 'HINDALCO', 'COALINDIA',
                'BRITANNIA', 'TECHM', 'INDUSINDBK', 'NESTLEIND', 'CIPLA', 'APOLLOHOSP',
                'DRREDDY', 'EICHERMOT', 'DIVISLAB', 'BAJAJFINSV', 'HEROMOTOCO', 'TATACONSUM',
                'BPCL', 'SBILIFE', 'UPL', 'ADANI', 'TATA', 'BAJAJ', 'HDFC', 'ICICI'
            ];

            // If it starts with a known Indian prefix and has no suffix, assume NSE
            const isIndianStock = indianStocks.some(stock => symbol.startsWith(stock)) && !symbol.includes('.');

            if (isIndianStock) {
                symbol = `${symbol}.NS`; // Add NSE exchange suffix
                logger.info(`Auto-formatted Indian stock: ${identifier} → ${symbol}`);
            }
        }

        // Yahoo Finance with headers to avoid rate limiting on production servers
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

        let response;
        try {
            response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Referer': 'https://finance.yahoo.com/'
                },
                timeout: 15000
            });
        } catch (error) {
            if (error.response) {
                throw new Error(`Yahoo Finance API error: ${error.response.status} - ${error.response.statusText}`);
            } else if (error.request) {
                throw new Error(`Yahoo Finance API error: No response received for ${symbol}`);
            } else {
                throw new Error(`Yahoo Finance API error: ${error.message}`);
            }
        }

        if (response.status !== 200) {
            throw new Error(`Yahoo Finance API error: ${response.status}`);
        }

        const data = response.data; // Axios automatically parses JSON
        const quote = data?.chart?.result?.[0];

        if (!quote) {
            throw new Error(`No data found for ${symbol}`);
        }

        const meta = quote.meta;
        const price = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose;
        const change = price - previousClose;
        const changePercent = ((change / previousClose) * 100).toFixed(2);

        // Yahoo often reports 'USD' for Indian symbols incorrectly in some endpoints
        let currency = meta.currency;
        if (symbol.endsWith('.NS') || symbol.endsWith('.BO') || symbol.includes('^NSE') || symbol.includes('^BSE')) {
            currency = 'INR';
        }

        return {
            symbol: identifier,
            price: price.toFixed(2),
            change: change.toFixed(2),
            changePercent: `${changePercent}%`,
            currency: currency,
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
 * Crypto providers — CoinGecko primary, CoinCap fallback (both free, no API key)
 */
const cryptoProviders = {
    /**
     * CoinGecko (Free, no API key — 10-30 req/min limit)
     */
    coingecko: async (identifier) => {
        const coinMap = {
            'BTC': 'bitcoin', 'BITCOIN': 'bitcoin',
            'ETH': 'ethereum', 'ETHEREUM': 'ethereum',
            'SOL': 'solana', 'SOLANA': 'solana',
            'USDT': 'tether', 'TETHER': 'tether',
            'BNB': 'binancecoin', 'XRP': 'ripple',
            'ADA': 'cardano', 'DOGE': 'dogecoin',
            'DOT': 'polkadot', 'MATIC': 'matic-network',
            'AVAX': 'avalanche-2', 'LINK': 'chainlink'
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
            throw new Error(`Crypto ${identifier} not found on CoinGecko`);
        }

        return {
            symbol: identifier.toUpperCase(),
            price: priceData.usd.toFixed(2),
            change24h: priceData.usd_24h_change?.toFixed(2) || '0.00',
            changePercent: `${priceData.usd_24h_change?.toFixed(2) || '0.00'}%`,
            provider: 'coingecko',
            timestamp: new Date().toISOString()
        };
    },

    /**
     * CoinCap (Free, no API key — generous rate limits)
     */
    coincap: async (identifier) => {
        const coinMap = {
            'BTC': 'bitcoin', 'BITCOIN': 'bitcoin',
            'ETH': 'ethereum', 'ETHEREUM': 'ethereum',
            'SOL': 'solana', 'SOLANA': 'solana',
            'USDT': 'tether', 'TETHER': 'tether',
            'BNB': 'binance-coin', 'XRP': 'xrp',
            'ADA': 'cardano', 'DOGE': 'dogecoin',
            'DOT': 'polkadot', 'MATIC': 'polygon',
            'AVAX': 'avalanche', 'LINK': 'chainlink'
        };

        const coinId = coinMap[identifier.toUpperCase()] || identifier.toLowerCase();
        const url = `https://api.coincap.io/v2/assets/${coinId}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CoinCap API error: ${response.status}`);
        }

        const json = await response.json();
        const coin = json.data;

        if (!coin) {
            throw new Error(`Crypto ${identifier} not found on CoinCap`);
        }

        const price = parseFloat(coin.priceUsd);
        const change24h = parseFloat(coin.changePercent24Hr) || 0;

        return {
            symbol: identifier.toUpperCase(),
            price: price.toFixed(2),
            change24h: change24h.toFixed(2),
            changePercent: `${change24h.toFixed(2)}%`,
            provider: 'coincap',
            timestamp: new Date().toISOString()
        };
    }
};

// Provider fallback order for crypto
const CRYPTO_FALLBACK_ORDER = ['coingecko', 'coincap'];

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
            case 'gold':
            case 'commodity':
            case 'commodities': {
                // Auto-map source names to identifiers when no identifier given
                let effectiveIdentifier = identifier;
                if (!effectiveIdentifier) {
                    const sourceToSymbol = { 'gold': 'GOLD', 'commodity': 'GOLD', 'commodities': 'GOLD' };
                    effectiveIdentifier = sourceToSymbol[source];
                    if (effectiveIdentifier) {
                        logger.info(`Auto-mapped source "${source}" to identifier "${effectiveIdentifier}"`);
                    }
                }
                if (!effectiveIdentifier) {
                    throw new Error(`fetch_data: "identifier" (symbol) is required for ${source} data`);
                }

                // Default to Yahoo Finance (free, no key needed)
                const selectedMarketProvider = provider || 'yahoo';

                if (!marketProviders[selectedMarketProvider]) {
                    throw new Error(`Unknown market provider: ${selectedMarketProvider}`);
                }

                return await marketProviders[selectedMarketProvider](effectiveIdentifier, apiKey);
            }

            case 'crypto': {
                // If specific provider requested, try just that one
                if (provider && cryptoProviders[provider]) {
                    return await cryptoProviders[provider](identifier);
                }

                // Otherwise try all providers in fallback order
                let lastError;
                for (const providerName of CRYPTO_FALLBACK_ORDER) {
                    try {
                        logger.info(`Trying crypto provider: ${providerName}`, { identifier });
                        const result = await cryptoProviders[providerName](identifier);
                        return result;
                    } catch (err) {
                        lastError = err;
                        const isRateLimit = err.message.includes('429');
                        logger.warn(`${providerName} failed${isRateLimit ? ' (rate limited)' : ''}: ${err.message}, trying next...`);
                    }
                }
                throw lastError || new Error(`All crypto providers failed for ${identifier}`);
            }

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
 * Uses auto-fallback: CoinGecko → CoinCap
 */
export const fetchCryptoPrice = async (params, context) => {
    return fetchData({
        source: 'crypto',
        identifier: params.symbol
    }, context);
};

export default {
    fetchData,
    fetchStockPrice,
    fetchCryptoPrice
};
