// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Now import services
import logger from '../utils/logger.js';
import { sendEmail as sendEmailService } from '../integrations/email/emailService.js';
import { fetchData, fetchStockPrice, fetchCryptoPrice } from '../integrations/fetch/fetchHandler.js';
import whatsappService from '../integrations/whatsapp/whatsappService.js';
import smsService from '../integrations/sms/smsService.js';
import webScraper from '../integrations/web/webScraperService.js';
import discordService from '../integrations/messaging/discordService.js';
import slackService from '../integrations/messaging/slackService.js';
