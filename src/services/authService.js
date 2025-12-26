import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

/**
 * Authentication service for JWT and password operations
 */
const authService = {
    /**
     * Generate JWT token for user
     * @param {number} userId
     * @returns {string} JWT token
     */
    generateToken: (userId) => {
        const secret = process.env.JWT_SECRET || 'default-secret';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

        const token = jwt.sign({ userId }, secret, { expiresIn });
        logger.debug('Generated JWT token for user', { userId });
        return token;
    },

    /**
     * Verify JWT token
     * @param {string} token
     * @returns {Object|null} Decoded token or null if invalid
     */
    verifyToken: (token) => {
        try {
            const secret = process.env.JWT_SECRET || 'default-secret';
            const decoded = jwt.verify(token, secret);
            return decoded;
        } catch (error) {
            logger.debug('Token verification failed', { error: error.message });
            return null;
        }
    },

    /**
     * Hash password
     * @param {string} password
     * @returns {Promise<string>} Hashed password
     */
    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    },

    /**
     * Compare password with hash
     * @param {string} password
     * @param {string} hash
     * @returns {Promise<boolean>}
     */
    comparePassword: async (password, hash) => {
        return bcrypt.compare(password, hash);
    }
};

export default authService;
