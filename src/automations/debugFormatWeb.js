import logger from '../utils/logger.js';
import { sendEmail as sendEmailService } from '../integrations/email/emailService.js';
import { fetchData, fetchStockPrice, fetchCryptoPrice } from '../integrations/fetch/fetchHandler.js';
import whatsappService from '../integrations/whatsapp/whatsappService.js';
import smsService from '../integrations/sms/smsService.js';
import webScraper from '../integrations/web/webScraperService.js';

// Test function - add this temporarily
const formatWebDigestTest = async (params, context) => {
    console.log('=== FORMAT WEB DIGEST DEBUG ===');
    console.log('Provider:', params.provider);
    console.log('Context keys:', Object.keys(context));
    console.log('StepOutputs:', JSON.stringify(context.stepOutputs, null, 2));

    const provider = params.provider;
    const stepOutputs = context.stepOutputs || {};

    // Access step_1 directly
    const step1 = stepOutputs['step_1'];
    console.log('Step 1 data:', step1);

    if (step1) {
        const formatted = await webScraper.formatDigest(provider, step1);
        return { digest: formatted };
    }

    throw new Error('No step_1 found!');
};

export { formatWebDigestTest };
