
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

console.log('--- DEBUG INFO ---');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('SSL Mode:', process.env.DB_HOST && process.env.DB_HOST.includes('render.com') ? 'Enabled (Render)' : 'Disabled/Default');
console.log('------------------');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com')
        ? { rejectUnauthorized: false }
        : true, // Force SSL for other remote hosts usually, or at least try it
    connectionTimeoutMillis: 5000,
});

(async () => {
    try {
        console.log('Attempting connection...');
        const client = await pool.connect();
        console.log('Successfully connected!');
        const res = await client.query('SELECT NOW()');
        console.log('Server time:', res.rows[0].now);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
})();
