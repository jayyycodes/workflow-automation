import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /user/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove sensitive data
        delete user.password_hash;

        res.json({ user });
    } catch (error) {
        logger.error('Error fetching user profile:', error);
        next(error);
    }
});

/**
 * PUT /user/profile
 * Update user profile (phone numbers)
 */
router.put('/profile', authMiddleware, async (req, res, next) => {
    try {
        const { phoneNumber, whatsappNumber } = req.body;

        // Validate phone number format (basic validation)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;

        if (phoneNumber && !phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
            return res.status(400).json({
                error: 'Invalid phone number format. Please use international format (e.g., +919876543210)'
            });
        }

        if (whatsappNumber && !phoneRegex.test(whatsappNumber.replace(/\s/g, ''))) {
            return res.status(400).json({
                error: 'Invalid WhatsApp number format. Please use international format (e.g., +919876543210)'
            });
        }

        const updatedUser = await User.updateProfile(req.user.id, {
            phoneNumber,
            whatsappNumber
        });

        // Remove sensitive data
        delete updatedUser.password_hash;

        logger.info('User profile updated', { userId: req.user.id, phoneNumber, whatsappNumber });

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        logger.error('Error updating user profile:', error);
        next(error);
    }
});

export default router;
