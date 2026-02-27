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

// ─── Google OAuth ────────────────────────────────────────────────────────

/**
 * @route GET /auth/google/login
 * @desc Get Google Sign-in URL
 * @access Public
 */
router.get('/google/login', authController.googleLogin);

/**
 * @route GET /auth/google/callback
 * @desc Google OAuth callback (handles login + connect)
 * @access Public
 */
router.get('/google/callback', authController.googleCallback);

/**
 * @route GET /auth/google/connect
 * @desc Start Google API connect flow (Sheets, Gmail, etc.)
 * @access Private
 */
router.get('/google/connect', authMiddleware, authController.googleConnect);

/**
 * @route GET /auth/google/status
 * @desc Check which Google services are connected
 * @access Private
 */
router.get('/google/status', authMiddleware, authController.googleStatus);

export default router;
