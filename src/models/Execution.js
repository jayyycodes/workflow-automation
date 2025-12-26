import { query } from '../config/db.js';
import { EXECUTION_STATUS } from '../utils/constants.js';
import logger from '../utils/logger.js';

/**
 * Execution model for database operations
 */
const Execution = {
    /**
     * Create executions table
     */
    createTable: async () => {
        const sql = `
      CREATE TABLE IF NOT EXISTS executions (
        id SERIAL PRIMARY KEY,
        automation_id INTEGER REFERENCES automations(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT '${EXECUTION_STATUS.PENDING}',
        input JSONB,
        result JSONB,
        error TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await query(sql);
        logger.info('Executions table created/verified');
    },

    /**
     * Create a new execution record
     * @param {Object} data - { automationId, input }
     * @returns {Promise<Object>} Created execution
     */
    create: async ({ automationId, input = null }) => {
        const sql = `
      INSERT INTO executions (automation_id, input, status, started_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
        const result = await query(sql, [
            automationId,
            input ? JSON.stringify(input) : null,
            EXECUTION_STATUS.RUNNING
        ]);
        return result.rows[0];
    },

    /**
     * Update execution status and result
     * @param {number} id
     * @param {Object} data - { status, result, error }
     * @returns {Promise<Object>}
     */
    complete: async (id, { status, result = null, error = null }) => {
        const sql = `
      UPDATE executions 
      SET status = $1, result = $2, error = $3, completed_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
        const queryResult = await query(sql, [
            status,
            result ? JSON.stringify(result) : null,
            error,
            id
        ]);
        return queryResult.rows[0];
    },

    /**
     * Find executions by automation ID
     * @param {number} automationId
     * @returns {Promise<Array>}
     */
    findByAutomationId: async (automationId) => {
        const sql = `
      SELECT * FROM executions 
      WHERE automation_id = $1 
      ORDER BY created_at DESC
    `;
        const result = await query(sql, [automationId]);
        return result.rows;
    },

    /**
     * Find execution by ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    findById: async (id) => {
        const sql = `SELECT * FROM executions WHERE id = $1`;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }
};

export default Execution;
