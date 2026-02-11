import express from 'express';
import { db } from '../config/firebase.js';
import authMiddleware from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /user/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware, async (req, res, next) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.id).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = { id: userDoc.id, ...userDoc.data() };

        // Remove sensitive data (though Firestore usually doesn't store password_hash if done right, but good safety)
        delete user.password_hash;
        delete user.password;

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

        const updates = {};
        if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
        if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber;
        updates.updated_at = new Date().toISOString();

        await db.collection('users').doc(req.user.id).update(updates);

        // Fetch updated user
        const updatedDoc = await db.collection('users').doc(req.user.id).get();
        const updatedUser = { id: updatedDoc.id, ...updatedDoc.data() };

        // Remove sensitive data
        delete updatedUser.password_hash;
        delete updatedUser.password;

        logger.info('User profile updated', { userId: req.user.id, ...updates });

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
