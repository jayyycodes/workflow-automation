import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import automationRoutes from './routes/automations.js';
import userRoutes from './routes/user.js';
import { testConnection } from './config/db.js';
import { loadActiveAutomations, getSchedulerStats } from './scheduler/scheduler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Production security checks
if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
        logger.error('🚨 CRITICAL: Change JWT_SECRET in production!');
        process.exit(1);
    }
}

// CORS Configuration - secure for production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || false  // Only allow specific frontend in production
        : true,  // Allow all in development
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        scheduler: getSchedulerStats()
    });
});

// Routes
app.use('/auth', authRoutes);
app.use('/automations', automationRoutes);
app.use('/user', userRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler
app.use(errorHandler);

// Start server
let server; // Store server instance for graceful shutdown

const startServer = async () => {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
        logger.warn('Database connection failed. Server will start but database features may not work.');
    }

    // Initialize scheduler for active automations
    if (dbConnected) {
        await loadActiveAutomations();
    }

    server = app.listen(PORT, () => {
        logger.info(`🚀 Server running on http://localhost:${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer();

// Graceful shutdown handlers
const shutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
        logger.info('HTTP server closed');
    });

    // Stop all scheduled jobs
    const { stopAll } = await import('./scheduler/scheduler.js');
    stopAll();

    // Close database pool
    const pool = (await import('./config/db.js')).default;
    await pool.end();
    logger.info('Database pool closed');

    logger.info('Graceful shutdown complete');
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
