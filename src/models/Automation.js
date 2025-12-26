import { query } from '../config/db.js';
import { AUTOMATION_STATUS } from '../utils/constants.js';
import logger from '../utils/logger.js';

/**
 * Automation model for database operations
 */
const Automation = {
  /**
   * Create automations table
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS automations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        trigger JSONB NOT NULL,
        steps JSONB NOT NULL,
        status VARCHAR(50) DEFAULT '${AUTOMATION_STATUS.DRAFT}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await query(sql);
    logger.info('Automations table created/verified');
  },

  /**
   * Create a new automation
   * @param {Object} data - { userId, name, description, trigger, steps, status }
   * @returns {Promise<Object>} Created automation
   */
  create: async ({ userId, name, description, trigger, steps, status = AUTOMATION_STATUS.DRAFT }) => {
    const sql = `
      INSERT INTO automations (user_id, name, description, trigger, steps, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await query(sql, [
      userId,
      name,
      description || null,
      JSON.stringify(trigger),
      JSON.stringify(steps),
      status
    ]);
    return result.rows[0];
  },

  /**
   * Find all automations for a user
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  findByUserId: async (userId) => {
    const sql = `
      SELECT * FROM automations 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await query(sql, [userId]);
    return result.rows;
  },

  /**
   * Find automation by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById: async (id) => {
    const sql = `SELECT * FROM automations WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Update automation status
   * @param {number} id
   * @param {string} status
   * @returns {Promise<Object>}
   */
  updateStatus: async (id, status) => {
    const sql = `
      UPDATE automations 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [status, id]);
    return result.rows[0];
  },

  /**
   * Find all automations by status
   * @param {string} status
   * @returns {Promise<Array>}
   */
  findByStatus: async (status) => {
    const sql = `
      SELECT * FROM automations 
      WHERE status = $1 
      ORDER BY created_at DESC
    `;
    const result = await query(sql, [status]);
    return result.rows;
  },

  /**
   * Delete automation by ID
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    const sql = `DELETE FROM automations WHERE id = $1`;
    await query(sql, [id]);
  }
};

export default Automation;
