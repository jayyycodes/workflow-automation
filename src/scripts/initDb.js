import 'dotenv/config';
import User from '../models/User.js';
import Automation from '../models/Automation.js';
import Execution from '../models/Execution.js';
import { testConnection } from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Initialize database tables
 */
const initDatabase = async () => {
    logger.info('Initializing database...');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
        logger.error('Cannot connect to database. Please check your configuration.');
        process.exit(1);
    }

    try {
        // Create tables in order (respecting foreign keys)
        await User.createTable();
        await Automation.createTable();
        await Execution.createTable();

        // Run migrations
        logger.info('Running migrations...');

        // Add phone number columns if they don't exist
        const { query } = await import('../config/db.js');

        const checkSql = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('phone_number', 'whatsapp_number');
        `;

        const existingColumns = await query(checkSql);
        const columnNames = existingColumns.rows.map(row => row.column_name);

        if (!columnNames.includes('phone_number')) {
            logger.info('Adding phone_number column...');
            await query('ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) NULL;');
            logger.info('✓ phone_number column added');
        } else {
            logger.info('✓ phone_number column already exists');
        }

        if (!columnNames.includes('whatsapp_number')) {
            logger.info('Adding whatsapp_number column...');
            await query('ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR(20) NULL;');
            logger.info('✓ whatsapp_number column added');
        } else {
            logger.info('✓ whatsapp_number column already exists');
        }

        logger.info('✅ Database initialized successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Failed to initialize database', error);
        process.exit(1);
    }
};

initDatabase();
