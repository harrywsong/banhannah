// backend/src/utils/processManager.js - Process management and crash handling
import { logger } from './logger.js';

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown(server, prisma) {
  const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connections
        if (prisma) {
          await prisma.$disconnect();
          logger.info('Database connections closed');
        }
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
      
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };
  
  // Handle different shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
}

/**
 * Setup crash handlers
 */
export function setupCrashHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    logger.error('Stack trace:', error.stack);
    
    // Try to close gracefully, but exit anyway
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise);
    logger.error('Reason:', reason);
    
    // Don't exit immediately for promise rejections
    // Log and continue, let process manager handle restarts
  });
  
  // Handle warnings
  process.on('warning', (warning) => {
    logger.warn('Process warning:', warning);
  });
  
  // Log process events
  process.on('exit', (code) => {
    logger.info(`Process exiting with code: ${code}`);
  });
}

/**
 * Health check endpoint data
 */
export function getHealthStatus() {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  return {
    status: 'healthy',
    uptime: uptime,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
    },
    pid: process.pid,
    version: process.version
  };
}