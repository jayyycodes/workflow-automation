import authService from '../services/authService.js';
import logger from '../utils/logger.js';
import { db } from '../config/firebase.js';

/**
 * JWT Authentication middleware
 * Protects routes by requiring valid JWT token
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token (Custom JWT)
        const decoded = authService.verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
        }

        // Fetch full user object from Firestore
        const userDoc = await db.collection('users').doc(decoded.userId).get();

        if (!userDoc.exists) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
        }

        const userData = userDoc.data();
        const user = {
            id: userDoc.id,
            email: userData.email,
            name: userData.name,
            whatsappNumber: userData.whatsapp_number
        };

        // Attach full user object to request
        req.user = user;
        logger.debug('User authenticated', { userId: user.id, email: user.email });

        next();
    } catch (error) {
        logger.error('Auth middleware error', error);

        // Differentiate between Auth errors and Server errors
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
        }

        // For other errors (database, etc), return 500
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication service error'
        });
    }
};

export default authMiddleware;
