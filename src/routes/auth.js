import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /auth/login
 * @desc Login user and return JWT
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route GET /auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', authMiddleware, authController.me);

export default router;
