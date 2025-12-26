import User from '../models/User.js';
import authService from '../services/authService.js';
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
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Email already registered'
                });
            }

            // Hash password
            const passwordHash = await authService.hashPassword(password);

            // Create user
            const user = await User.create({
                email,
                passwordHash,
                name: name || null,
                whatsappNumber: whatsappNumber || null
            });

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
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid email or password'
                });
            }

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
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'User not found'
                });
            }

            // Remove sensitive data
            delete user.password_hash;

            res.json({
                user
            });

        } catch (error) {
            next(error);
        }
    }
};

export default authController;
