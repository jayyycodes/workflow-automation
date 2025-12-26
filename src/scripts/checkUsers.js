import dotenv from 'dotenv';
import { query } from '../config/db.js';

dotenv.config();

/**
 * Quick script to check user data in database
 */
async function checkUsers() {
    try {
        console.log('\n=== Checking Users in Database ===\n');

        const result = await query(`
            SELECT id, email, name, phone_number, whatsapp_number, created_at 
            FROM users 
            ORDER BY created_at DESC
            LIMIT 5
        `);

        if (result.rows.length === 0) {
            console.log('No users found in database');
            process.exit(0);
        }

        console.log(`Found ${result.rows.length} user(s):\n`);

        result.rows.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Name: ${user.name || 'N/A'}`);
            console.log(`  Phone Number: ${user.phone_number || 'NOT SET'}`);
            console.log(`  WhatsApp Number: ${user.whatsapp_number || 'NOT SET'}`);
            console.log(`  Created: ${new Date(user.created_at).toLocaleString()}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
}

checkUsers();
