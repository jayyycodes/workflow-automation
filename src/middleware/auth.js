import authService from '../services/authService.js';
import logger from '../utils/logger.js';

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

        // Verify token
        const decoded = authService.verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
        }

        // Fetch full user object from database
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
        }

        // Attach full user object to request (id, email, name)
        req.user = user;
        logger.debug('User authenticated', { userId: user.id, email: user.email });

        next();
    } catch (error) {
        logger.error('Auth middleware error', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication failed'
        });
    }
};

export default authMiddleware;
