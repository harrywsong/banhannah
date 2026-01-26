// server.js - Entry point
import app from './src/app.js';
import { ENV } from './src/config/env.js';
import { logger } from './src/utils/logger.js';
import { prisma } from './src/config/database.js';
import { initializeAdmin } from './src/services/auth.service.js';
import { setupGracefulShutdown, setupCrashHandlers, getHealthStatus } from './src/utils/processManager.js';

const PORT = ENV.PORT;
const HOST = ENV.HOST;

async function startServer() {
  try {
    // Setup crash handlers first
    setupCrashHandlers();
    
    // Test database connection
    await prisma.$connect();
    logger.info('✓ Database connected');

    // Initialize admin user
    await initializeAdmin();

    // Start server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`✓ Server running on http://${HOST}:${PORT}`);
      logger.info(`✓ Environment: ${ENV.NODE_ENV}`);
      logger.info(`✓ Frontend: ${ENV.FRONTEND_URL}`);
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server, prisma);

    // Enhanced health check endpoint
    app.get('/health', (req, res) => {
      res.json(getHealthStatus());
    });

    return server;

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      // Set a hard timeout for shutdown
      const forceExit = setTimeout(() => {
        logger.warn('Forcefully shutting down after timeout');
        process.exit(1);
      }, 3000);

      try {
        server.close(() => {
          logger.info('HTTP server closed');
        });

        await prisma.$disconnect();
        logger.info('✓ Database disconnected');

        clearTimeout(forceExit);
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();