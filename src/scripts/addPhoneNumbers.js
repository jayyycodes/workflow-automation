import dotenv from 'dotenv';
import { query } from '../config/db.js';
import logger from '../utils/logger.js';

dotenv.config();

/**
 * Migration script to add phone number fields to users table
 */
async function addPhoneNumbers() {
    try {
        logger.info('Starting migration: Add phone numbers to users table');

        // Check if columns already exist
        const checkSql = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('phone_number', 'whatsapp_number');
        `;

        const existingColumns = await query(checkSql);
        const columnNames = existingColumns.rows.map(row => row.column_name);

        // Add phone_number column if it doesn't exist
        if (!columnNames.includes('phone_number')) {
            logger.info('Adding phone_number column...');
            await query(`
                ALTER TABLE users 
                ADD COLUMN phone_number VARCHAR(20) NULL;
            `);
            logger.info('✓ phone_number column added');
        } else {
            logger.info('✓ phone_number column already exists');
        }

        // Add whatsapp_number column if it doesn't exist
        if (!columnNames.includes('whatsapp_number')) {
            logger.info('Adding whatsapp_number column...');
            await query(`
                ALTER TABLE users 
                ADD COLUMN whatsapp_number VARCHAR(20) NULL;
            `);
            logger.info('✓ whatsapp_number column added');
        } else {
            logger.info('✓ whatsapp_number column already exists');
        }

        logger.info('Migration completed successfully!');
        logger.info('\nUsers table now includes:');
        logger.info('  - phone_number (VARCHAR 20, nullable)');
        logger.info('  - whatsapp_number (VARCHAR 20, nullable)');

        process.exit(0);
    } catch (error) {
        logger.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
addPhoneNumbers();
