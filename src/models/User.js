import { query } from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * User model for database operations
 */
const User = {
  /**
   * Create users table
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await query(sql);
    logger.info('Users table created/verified');
  },

  /**
   * Create a new user
   * @param {Object} userData - { email, passwordHash, name, whatsappNumber }
   * @returns {Promise<Object>} Created user
   */
  create: async ({ email, passwordHash, name, whatsappNumber }) => {
    const sql = `
      INSERT INTO users (email, password_hash, name, whatsapp_number)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, whatsapp_number, created_at
    `;
    const result = await query(sql, [email, passwordHash, name, whatsappNumber || null]);
    return result.rows[0];
  },

  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  findByEmail: async (email) => {
    const sql = `SELECT * FROM users WHERE email = $1`;
    const result = await query(sql, [email]);
    return result.rows[0] || null;
  },

  /**
   * Find user by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById: async (id) => {
    const sql = `SELECT id, email, name, whatsapp_number, created_at FROM users WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Update user profile (whatsapp number)
   * @param {number} id - User ID
   * @param {Object} updates - { whatsappNumber }
   * @returns {Promise<Object>} Updated user
   */
  updateProfile: async (id, { whatsappNumber }) => {
    // Simplified - only whatsapp_number field
    if (whatsappNumber === undefined) {
      // No updates, just return current user
      return User.findById(id);
    }

    const sql = `
      UPDATE users 
      SET whatsapp_number = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, name, whatsapp_number, created_at, updated_at
    `;

    const result = await query(sql, [whatsappNumber, id]);
    return result.rows[0];
  }
};

export default User;
