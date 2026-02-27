import { db } from '../config/firebase.js';
import authService from '../services/authService.js';
import googleOAuth from '../services/googleOAuth.js';
import logger from '../utils/logger.js';

/**
 * Auth controller for registration and login
 */
const authController = {
    /**
     * Register a new user
     * POST /auth/register
     */
    register: async (req, res, next) => {
        try {
            const { email, password, name, whatsappNumber } = req.body;

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Email and password are required'
                });
            }

            // Phone number is now REQUIRED
            if (!whatsappNumber) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Phone number is required for notifications'
                });
            }

            // Strict email validation
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Please enter a valid email address'
                });
            }

            // Check for common fake email domains
            const fakeDomains = ['test.com', 'example.com', 'fake.com', 'temp.com'];
            const emailDomain = email.split('@')[1]?.toLowerCase();
            if (fakeDomains.includes(emailDomain)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Please use a real email address'
                });
            }

            // Check password length
            if (password.length < 6) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Password must be at least 6 characters'
                });
            }

            // Validate WhatsApp number format (now REQUIRED)
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            if (!phoneRegex.test(whatsappNumber.replace(/\s/g, ''))) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid phone number. Use international format with country code (e.g., +919876543210)'
                });
            }

            // Check if user already exists
            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (!userSnapshot.empty) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Email already registered'
                });
            }

            // Hash password
            const passwordHash = await authService.hashPassword(password);

            // Create user
            const newUser = {
                email,
                password_hash: passwordHash,
                name: name || null,
                whatsapp_number: whatsappNumber || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const docRef = await db.collection('users').add(newUser);
            const user = { id: docRef.id, ...newUser };

            // Generate token
            const token = authService.generateToken(user.id);

            logger.info('User registered', { userId: user.id, email: user.email, hasWhatsApp: !!whatsappNumber });

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    whatsappNumber: user.whatsapp_number
                },
                token
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * Login a user
     * POST /auth/login
     */
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Email and password are required'
                });
            }

            // Find user
            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (userSnapshot.empty) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid email or password'
                });
            }

            const userDoc = userSnapshot.docs[0];
            const user = { id: userDoc.id, ...userDoc.data() };

            // Verify password
            const isValid = await authService.comparePassword(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid email or password'
                });
            }

            // Generate token
            const token = authService.generateToken(user.id);

            logger.info('User logged in', { userId: user.id, email: user.email });

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * Get current user
     * GET /auth/me
     */
    me: async (req, res, next) => {
        try {
            const docRef = db.collection('users').doc(req.user.id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'User not found'
                });
            }

            const user = { id: doc.id, ...doc.data() };

            // Remove sensitive data
            delete user.password_hash;

            res.json({
                user
            });

        } catch (error) {
            next(error);
        }
    },

    // ─── Google OAuth Endpoints ─────────────────────────────────────────

    /**
     * Start Google Sign-in flow
     * GET /auth/google/login
     */
    googleLogin: async (req, res, next) => {
        try {
            const url = googleOAuth.getLoginUrl();
            res.json({ url });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Google OAuth callback (handles both login and connect)
     * GET /auth/google/callback
     */
    googleCallback: async (req, res, next) => {
        try {
            const { code, state: stateParam } = req.query;

            if (!code) {
                return res.status(400).json({ error: 'Missing authorization code' });
            }

            const { tokens, state, userInfo } = await googleOAuth.handleCallback(code, stateParam);

            if (state.purpose === 'login') {
                // ─── Google Sign-in / Sign-up ────────────────────────
                let userId;

                // Check if user exists by email
                const userSnapshot = await db.collection('users')
                    .where('email', '==', userInfo.email).get();

                if (!userSnapshot.empty) {
                    // Existing user — log them in
                    userId = userSnapshot.docs[0].id;
                    logger.info('Google Sign-in: existing user', { userId, email: userInfo.email });
                } else {
                    // New user — create account
                    const newUser = {
                        email: userInfo.email,
                        name: userInfo.name || null,
                        picture: userInfo.picture || null,
                        google_id: userInfo.id,
                        auth_provider: 'google',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    const docRef = await db.collection('users').add(newUser);
                    userId = docRef.id;
                    logger.info('Google Sign-in: new user created', { userId, email: userInfo.email });
                }

                // Store Google tokens for API access
                await googleOAuth.storeUserTokens(userId, tokens, tokens.scope?.split(' '));

                // Generate JWT
                const jwt = authService.generateToken(userId);

                // Redirect to frontend with token
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
                return res.redirect(`${frontendUrl}/dashboard?token=${jwt}&google=true`);

            } else if (state.purpose === 'connect') {
                // ─── Connect Google APIs to existing account ─────────
                const userId = state.userId;
                if (!userId) {
                    return res.status(400).json({ error: 'Missing userId in state' });
                }

                await googleOAuth.storeUserTokens(userId, tokens, tokens.scope?.split(' '));

                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
                return res.redirect(`${frontendUrl}/dashboard/settings?connected=google`);

            } else {
                return res.status(400).json({ error: 'Unknown OAuth purpose' });
            }

        } catch (error) {
            logger.error('Google OAuth callback error', { error: error.message });
            next(error);
        }
    },

    /**
     * Start Google API connect flow (for existing authenticated users)
     * GET /auth/google/connect
     * Requires auth middleware
     */
    googleConnect: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { scopes } = req.query;

            // Default to all API scopes if not specified
            let requestedScopes = googleOAuth.ALL_API_SCOPES;
            if (scopes) {
                const scopeMap = googleOAuth.GOOGLE_SCOPES;
                requestedScopes = scopes.split(',').flatMap(s => scopeMap[s.toUpperCase()] || []);
            }

            const url = googleOAuth.getAuthUrl(userId, requestedScopes, 'connect');
            res.json({ url });

        } catch (error) {
            next(error);
        }
    },

    /**
     * Check Google connection status
     * GET /auth/google/status
     * Requires auth middleware
     */
    googleStatus: async (req, res, next) => {
        try {
            const status = await googleOAuth.getConnectionStatus(req.user.id);
            res.json(status);
        } catch (error) {
            next(error);
        }
    }
};

export default authController;
