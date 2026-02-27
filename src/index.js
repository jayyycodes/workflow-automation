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
import registryRoutes from './routes/registry.js';
import webhookRoutes from './routes/webhooks.js';
import mcpRoutes from './mcp/mcpRoutes.js';
import './config/firebase.js'; // Ensure Firebase is initialized
import { loadActiveAutomations, getSchedulerStats } from './scheduler/scheduler.js';
import toolRegistry from './registry/toolRegistry.js';
import stepRegistry from './automations/stepRegistry.js';
import { warmupMcpCache, getMcpServerInfo } from './mcp/mcpServer.js';

// Initialize Tool Registry — link handler functions from stepRegistry
toolRegistry.linkHandlers(stepRegistry);

// Warm up MCP tool cache (pre-compute tool list for fast discovery)
warmupMcpCache();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
// Server restart verification
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    const schedulerStats = getSchedulerStats();
    const registryInfo = toolRegistry.getRegistryInfo();
    const mcpInfo = getMcpServerInfo();
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        scheduler: schedulerStats,
        registry: registryInfo,
        mcp: mcpInfo
    });
});

// Routes
app.use('/auth', authRoutes);
app.use('/automations', automationRoutes);
app.use('/user', userRoutes);
app.use('/registry', registryRoutes);
app.use('/webhook', webhookRoutes);
app.use('/mcp', mcpRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
    logger.info(`✨ Server running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`📋 Tool Registry: ${toolRegistry.getRegistryInfo().totalTools} tools loaded`);
    logger.info(`🔌 MCP Server: POST http://localhost:${PORT}/mcp (stateless Streamable HTTP)`);

    // Load active automations after server starts
    try {
        await loadActiveAutomations();
        logger.info('✅ Scheduler initialized with active automations');
    } catch (error) {
        logger.error('Failed to load active automations:', error);
    }
});

// Handle port-in-use: kill stale process and retry once
server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.warn(`⚠️ Port ${PORT} busy — killing stale process and retrying...`);
        try {
            const { execSync } = await import('child_process');
            // Find and kill the process using the port (Windows)
            const result = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, { encoding: 'utf8' });
            const lines = result.trim().split('\n');
            const pids = new Set(lines.map(l => l.trim().split(/\s+/).pop()).filter(Boolean));
            for (const pid of pids) {
                try { execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf8' }); } catch { }
            }
            // Wait for port to free up, then retry
            setTimeout(() => {
                server.listen(PORT);
            }, 1500);
        } catch (killErr) {
            logger.error(`Cannot free port ${PORT}. Kill the process manually and restart.`);
            process.exit(1);
        }
    } else {
        logger.error('Server error:', err);
        process.exit(1);
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
