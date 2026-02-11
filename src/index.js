// CRITICAL: Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Now import everything else after env vars are loaded
import express from 'express';
import cors from 'cors';

import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import automationRoutes from './routes/automations.js';
import userRoutes from './routes/user.js';
import './config/firebase.js'; // Ensure Firebase is initialized
import { loadActiveAutomations, getSchedulerStats } from './scheduler/scheduler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    const schedulerStats = getSchedulerStats();
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        scheduler: schedulerStats
    });
});

// Routes
app.use('/auth', authRoutes);
app.use('/automations', automationRoutes);
app.use('/user', userRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
    logger.info(`✨ Server running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);

    // Load active automations after server starts
    try {
        await loadActiveAutomations();
        logger.info('✅ Scheduler initialized with active automations');
    } catch (error) {
        logger.error('Failed to load active automations:', error);
    }
});

// Graceful shutdown
const shutdown = async () => {
    logger.info('SIGINT received. Starting graceful shutdown...');

    server.close(() => {
        logger.info('HTTP server closed');
    });

    // Stop all active automation jobs
    const { stopAllJobs } = await import('./scheduler/scheduler.js');
    logger.info('Stopping all scheduled jobs...');
    const stoppedCount = stopAllJobs();
    logger.info(`Stopped ${stoppedCount} scheduled jobs`);

    logger.info('Graceful shutdown complete');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
