import pg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pg;

/**
 * PostgreSQL connection pool
 */
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'workflow_automation',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Log connection status
pool.on('connect', () => {
    logger.debug('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug(`Query executed in ${duration}ms`, { text, rows: result.rowCount });
        return result;
    } catch (error) {
        logger.error('Database query error', { text, error: error.message });
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} Pool client
 */
export const getClient = async () => {
    return await pool.connect();
};

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW()');
        logger.info('Database connection successful', { time: result.rows[0].now });
        return true;
    } catch (error) {
        logger.error('Database connection failed', error);
        return false;
    }
};

export default pool;
