import logger from '../utils/logger.js';
import { sendEmail as sendEmailService } from '../integrations/email/emailService.js';
import { fetchData, fetchStockPrice, fetchCryptoPrice } from '../integrations/fetch/fetchHandler.js';
import whatsappService from '../integrations/whatsapp/whatsappService.js';
import smsService from '../integrations/sms/smsService.js';
import webScraper from '../integrations/web/webScraperService.js';

/**
 * Generic Notify Handler
 * Routes notifications to appropriate channel
 */

/**
 * Format phone number with country code
 * Auto-detects Indian numbers (10 digits starting with 6-9)
 */
const formatPhoneNumber = (phone) => {
    if (!phone) return null;

    // Remove any whitespace
    let cleaned = phone.toString().replace(/\s+/g, '');

    // Already has + prefix, return as is
    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    // Check if it's a 10-digit Indian number (starts with 6, 7, 8, or 9)
    if (/^[6-9]\d{9}$/.test(cleaned)) {
        return '+91' + cleaned; // Add India country code
    }

    // Otherwise, just add + prefix
    return '+' + cleaned;
};

const notify = async (params, context) => {
    const { channel, message, to, subject, body } = params;

    switch (channel) {
        case 'email':
            return await sendEmailService({ to, subject, body: body || message });

        case 'notification':
        case 'console':
            logger.info(`[NOTIFICATION] ${message}`);
            return {
                sent: true,
                channel: 'notification',
                message,
                timestamp: new Date().toISOString()
            };

        case 'whatsapp':
            if (!whatsappService.isReady()) {
                logger.warn('WhatsApp service not configured, skipping message');
                return {
                    success: false,
                    error: 'WhatsApp service not configured',
                    channel: 'whatsapp'
                };
            }
            return await whatsappService.sendMessage(to, message);

        case 'sms':
            if (!smsService.isReady()) {
                logger.warn('SMS service not configured, skipping message');
                return {
                    success: false,
                    error: 'SMS service not configured',
                    channel: 'sms'
                };
            }
            return await smsService.sendSMS(to, message);

        default:
            throw new Error(`Unsupported notification channel: ${channel}`);
    }
};

/**
 * Backward compatibility wrappers
 */
const sendNotification = async (params, context) => {
    return notify({ channel: 'notification', ...params }, context);
};

const sendEmail = async (params, context) => {
    // Auto-replace generic email with logged-in user's email
    let recipientEmail = params.to;

    if (!recipientEmail || recipientEmail === 'user@example.com') {
        recipientEmail = context.user?.email;

        if (!recipientEmail) {
            throw new Error('No recipient email specified and user email not available');
        }

        logger.info('Using logged-in user email for notification', { email: recipientEmail });
    }

    // DIGEST CHECK FIRST!
    const digestCheck = context.stepOutputs || {};
    const digest = Object.values(digestCheck).find(o => o?.digest);
    if (digest?.digest) {
        logger.info('📧 Using web scraper digest');
        return notify({
            channel: 'email',
            ...params,
            to: recipientEmail,
            body: digest.digest
        }, context);
    }

    // Build email body with data from previous steps
    let emailBody = params.body || params.message || 'Automation notification';

    // If there's stock price data from previous step, include it
    const previousStepOutputs = context.stepOutputs || {};
    const stockData = Object.values(previousStepOutputs).find(output => output?.symbol && output?.price);

    // Check for weather data from previous steps
    const weatherData = Object.values(previousStepOutputs).find(
        output => output?.location && output?.temperature !== undefined
    );

    if (weatherData) {
        const isMock = weatherData.mock ? ' (Mock Data)' : '';
        emailBody = `
🌤️ Weather Update for ${weatherData.location}${isMock}

Temperature: ${weatherData.temperature}°C (${weatherData.temperature_f}°F)
Condition: ${weatherData.condition}${weatherData.description ? ' - ' + weatherData.description : ''}
Feels Like: ${weatherData.feels_like}°C
Humidity: ${weatherData.humidity}%
Wind Speed: ${weatherData.wind_speed} km/h

Last Updated: ${new Date(weatherData.timestamp).toLocaleString()}

${weatherData.error ? `⚠️  ${weatherData.error}\n${weatherData.help}` : ''}
---
Powered by Smart Workflow Automation
        `.trim();

        logger.info('Email enhanced with weather data', { location: weatherData.location });
    } else if (stockData) {
        emailBody = `
Stock Update: ${stockData.symbol}

Current Price: ${stockData.currency || ''} ${stockData.price}
Change: ${stockData.change} (${stockData.changePercent})
Market State: ${stockData.marketState || 'Unknown'}
Last Updated: ${new Date(stockData.timestamp).toLocaleString()}

---
This is an automated notification from your Smart Workflow Automation system.
        `.trim();

        logger.info('Enhanced email with stock data', { symbol: stockData.symbol, price: stockData.price });
    }

    return notify({
        channel: 'email',
        ...params,
        to: recipientEmail,
        body: emailBody
    }, context);
};

const sendWhatsapp = async (params, context) => {
    // Auto-replace generic phone with logged-in user's WhatsApp number
    let recipientPhone = params.to;

    if (!recipientPhone || recipientPhone === '+1234567890') {
        // Simplified - only use whatsapp_number field
        recipientPhone = context.user?.whatsapp_number || context.user?.whatsappNumber;

        if (!recipientPhone) {
            throw new Error('No WhatsApp number specified. Please update your profile.');
        }

        // Format with country code (auto-detect India)
        recipientPhone = formatPhoneNumber(recipientPhone);

        logger.info('Using logged-in user WhatsApp number', { phone: recipientPhone });
    } else {
        // Format explicit phone number too
        recipientPhone = formatPhoneNumber(recipientPhone);
    }

    // Build message with data from previous steps
    let message = params.message || 'Automation notification';

    // If there's stock price data from previous step, include it
    const previousStepOutputs = context.stepOutputs || {};
    const stockData = Object.values(previousStepOutputs).find(output => output?.symbol && output?.price);

    if (stockData) {
        message = `
📊 Stock Update: ${stockData.symbol}

💰 Price: ${stockData.currency || ''} ${stockData.price}
📈 Change: ${stockData.change} (${stockData.changePercent})
🕒 ${new Date(stockData.timestamp).toLocaleString()}

Powered by Smart Workflow Automation
        `.trim();

        logger.info('Enhanced WhatsApp message with stock data', { symbol: stockData.symbol, price: stockData.price });
    }

    return notify({
        channel: 'whatsapp',
        ...params,
        to: recipientPhone,
        message
    }, context);
};

const sendSms = async (params, context) => {
    // Auto-replace generic phone with logged-in user's WhatsApp number (same as WhatsApp)
    let recipientPhone = params.to;

    if (!recipientPhone || recipientPhone === '+1234567890') {
        // Simplified - only use whatsapp_number field (same phone for SMS and WhatsApp)
        recipientPhone = context.user?.whatsapp_number || context.user?.whatsappNumber;

        if (!recipientPhone) {
            throw new Error('No phone number specified. Please update your profile.');
        }

        // Format with country code (auto-detect India)
        recipientPhone = formatPhoneNumber(recipientPhone);

        logger.info('Using logged-in user phone for SMS', { phone: recipientPhone });
    } else {
        // Format explicit phone number too
        recipientPhone = formatPhoneNumber(recipientPhone);
    }

    // DIGEST CHECK FIRST!
    const digestCheckSMS = context.stepOutputs || {};
    const digestSMS = Object.values(digestCheckSMS).find(o => o?.digest);
    if (digestSMS?.digest) {
        logger.info('📱 Using web scraper digest for SMS');
        return notify({
            channel: 'sms',
            ...params,
            to: recipientPhone,
            message: digestSMS.digest
        }, context);
    }

    // Build message with data from previous steps
    let message = params.message || 'Automation notification';

    // If there's stock price data from previous step, include it
    const previousStepOutputs = context.stepOutputs || {};
    const stockData = Object.values(previousStepOutputs).find(output => output?.symbol && output?.price);

    if (stockData) {
        message = `Stock Update: ${stockData.symbol}\nPrice: ${stockData.currency || ''} ${stockData.price}\nChange: ${stockData.change} (${stockData.changePercent})\n${new Date(stockData.timestamp).toLocaleString()}`;

        logger.info('Enhanced SMS message with stock data', { symbol: stockData.symbol, price: stockData.price });
    }

    return notify({
        channel: 'sms',
        ...params,
        to: recipientPhone,
        message
    }, context);
};

/**
 * Mock implementations (to be replaced with generic handlers)
 */
const jobSearch = async (params, context) => {
    const { query, location } = params;
    logger.info(`[MOCK] Searching jobs: ${query} in ${location || 'any location'}`);

    return {
        query,
        location: location || 'Remote',
        results: [
            { title: `Senior ${query}`, company: 'TechCorp', salary: '$150k' },
            { title: `${query} Lead`, company: 'StartupXYZ', salary: '$130k' }
        ],
        count: 2,
        timestamp: new Date().toISOString()
    };
};

const jobApply = async (params, context) => {
    const { jobId } = params;
    logger.info(`[MOCK] Applying to job: ${jobId || 'latest'}`);

    return {
        applied: true,
        jobId: jobId || 'mock-job-123',
        timestamp: new Date().toISOString()
    };
};

const fetchUrl = async (params, context) => {
    const { url } = params;
    logger.info(`[MOCK] Fetching URL: ${url}`);

    return {
        url,
        status: 200,
        data: { mock: true },
        timestamp: new Date().toISOString()
    };
};

/**
 * Fetch Weather Data (Real API)
 * Uses OpenWeatherMap API (free tier)
 */
const fetchWeather = async (params, context) => {
    const { location } = params;
    const apiKey = process.env.WEATHER_API_KEY;

    // If no API key, return mock data with warning
    if (!apiKey) {
        logger.warn('WEATHER_API_KEY not set, using mock data');
        return {
            location: location || 'Unknown',
            temperature: 25,
            temperature_f: 77,
            condition: 'Partly Cloudy',
            humidity: 65,
            feels_like: 26,
            wind_speed: 12,
            timestamp: new Date().toISOString(),
            mock: true,
            warning: 'Set WEATHER_API_KEY in .env for real data'
        };
    }

    try {
        // Handle "current" location - default to London for now  
        // TODO: Could add IP-based geolocation in future
        let city = location;
        if (!city || city === 'current' || city === 'Current') {
            city = 'London';
            logger.info('Using default location: London (current location not implemented yet)');
        }

        // OpenWeatherMap API (free tier: 1000 calls/day)
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        logger.info(`Fetching weather for: ${city}`);

        const response = await fetch(url);

        if (!response.ok) {
            // Handle specific error codes
            if (response.status === 401) {
                logger.error('Weather API 401: Invalid API key', {
                    apiKeyPresent: !!apiKey,
                    apiKeyLength: apiKey?.length
                });
                // Return mock data with helpful error
                return {
                    location: city,
                    temperature: 25,
                    temperature_f: 77,
                    condition: 'Partly Cloudy',
                    humidity: 65,
                    feels_like: 26,
                    wind_speed: 12,
                    timestamp: new Date().toISOString(),
                    mock: true,
                    error: '401 Unauthorized - Invalid API key',
                    help: 'OpenWeatherMap API key may be invalid or not activated yet. Keys can take 1-2 hours to activate after signup. Using mock data for now.'
                };
            }
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            location: data.name,
            country: data.sys.country,
            temperature: Math.round(data.main.temp),
            temperature_f: Math.round((data.main.temp * 9 / 5) + 32),
            condition: data.weather[0].main,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            feels_like: Math.round(data.main.feels_like),
            wind_speed: Math.round(data.wind.speed * 3.6), // m/s to km/h
            pressure: data.main.pressure,
            timestamp: new Date().toISOString(),
            icon: data.weather[0].icon
        };

    } catch (error) {
        logger.error('Weather fetch failed', { error: error.message, location });

        // If it's a 401 error, we already returned mock data above
        if (error.message.includes('401')) {
            throw error; // Already handled
        }

        // For other errors, return mock data with error info
        return {
            location: location || 'Unknown',
            temperature: 25,
            temperature_f: 77,
            condition: 'Partly Cloudy',
            humidity: 65,
            feels_like: 26,
            wind_speed: 12,
            timestamp: new Date().toISOString(),
            mock: true,
            error: error.message,
            help: 'Using mock weather data due to API error'
        };
    }
};

const condition = async (params, context) => {
    const { if: condition } = params;
    logger.info(`[MOCK] Evaluating condition: ${condition}`);

    return {
        condition,
        result: true,
        evaluated: true
    };
};

const delay = async (params, context) => {
    const duration = params.duration || '1s';
    const ms = parseDuration(duration);
    logger.info(`Delaying for ${duration} (${ms}ms)`);

    await new Promise(resolve => setTimeout(resolve, Math.min(ms, 5000)));

    return {
        delayed: true,
        duration,
        ms
    };
};

const parseDuration = (duration) => {
    const match = duration.match(/^(\d+)(s|m|h)$/);
    if (!match) return 1000;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        default: return 1000;
    }
};

/** 
 * Step Registry
 * 
 * Maps step types to implementations.
 * Moving towards generic actions (fetch_data, notify) while maintaining
 * backward compatibility with specific actions (fetch_stock_price, send_email).
 */

/**
 * Web Scraping Steps
 */
const scrapeGithub = async (params) => {
    const result = await webScraper.scrapeWeb('github', {
        username: params.username || params.github_username,
        repo_type: params.repo_type || 'stars'
    });
    logger.info('GitHub scrape completed', { username: params.username, items: result.data.items.length });
    return result.data;
};

const scrapeHackerNews = async (params) => {
    const result = await webScraper.scrapeWeb('hackernews', {
        story_type: params.story_type || 'top',
        count: params.count || 10
    });
    logger.info('HackerNews scrape completed', { story_type: params.story_type, items: result.data.items.length });
    return result.data;
};

const formatWebDigest = async (params, context) => {
    const provider = params.provider;
    const previousStep = context.stepOutputs?.['step_1'];

    if (!previousStep) {
        throw new Error('No step_1 data');
    }

    const formatted = await webScraper.formatDigest(provider, previousStep);
    return { digest: formatted };
};
const stepRegistry = {
    // Generic actions (NEW - scalable approach)
    fetch_data: fetchData,
    notify: notify,

    // Specific actions (BACKWARD COMPATIBLE)
    fetch_stock_price: fetchStockPrice,
    fetch_crypto_price: fetchCryptoPrice,
    fetch_weather: fetchWeather,
    send_notification: sendNotification,
    send_email: sendEmail,
    send_whatsapp: sendWhatsapp,
    send_sms: sendSms,

    // Web scraping
    scrape_github: scrapeGithub,
    scrape_hackernews: scrapeHackerNews,
    format_web_digest: formatWebDigest,

    // Utility actions
    job_search: jobSearch,
    job_apply: jobApply,
    fetch_url: fetchUrl,
    condition: condition,
    delay: delay,

    // Alias for placeholder step type
    placeholder: async (params) => {
        logger.warn('Placeholder step executed - needs proper configuration');
        return { placeholder: true, message: params.description || params.action };
    }
};

/**
 * Check if a step type is supported
 */
export const isStepSupported = (stepType) => {
    return stepType in stepRegistry;
};

/**
 * Get step handler
 */
export const getStepHandler = (stepType) => {
    return stepRegistry[stepType] || null;
};

export default stepRegistry;
