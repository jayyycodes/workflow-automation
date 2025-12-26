import dotenv from 'dotenv';
import { query } from '../config/db.js';
import logger from '../utils/logger.js';

dotenv.config();

/**
 * Delete all users from the database
 * WARNING: This is irreversible!
 */
async function deleteAllUsers() {
    try {
        console.log('\n⚠️  WARNING: This will delete ALL users from the database!');
        console.log('This action is IRREVERSIBLE.\n');

        // Count users first
        const countResult = await query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(countResult.rows[0].count);

        if (userCount === 0) {
            console.log('✅ No users found in database. Nothing to delete.');
            process.exit(0);
        }

        console.log(`Found ${userCount} user(s) in database.\n`);

        // Delete associated data first (foreign key constraints)
        console.log('🗑️  Deleting user automations...');
        const automationsResult = await query('DELETE FROM automations WHERE user_id IN (SELECT id FROM users)');
        console.log(`   Deleted ${automationsResult.rowCount} automation(s)`);

        console.log('🗑️  Deleting user executions...');
        const executionsResult = await query('DELETE FROM executions WHERE automation_id NOT IN (SELECT id FROM automations)');
        console.log(`   Deleted ${executionsResult.rowCount} execution(s)`);

        // Now delete users
        console.log('🗑️  Deleting users...');
        const usersResult = await query('DELETE FROM users');
        console.log(`   Deleted ${usersResult.rowCount} user(s)`);

        console.log('\n✅ All users deleted successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error deleting users:', error);
        process.exit(1);
    }
}

// Run the script
deleteAllUsers();
