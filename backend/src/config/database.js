// src/config/database.js - Prisma client singleton
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' }
    ]
  });
};

// Singleton pattern for Prisma Client
const globalForPrisma = global;
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle connection errors
prisma.$connect()
  .then(() => logger.info('✓ Prisma connected'))
  .catch((error) => {
    logger.error('✗ Prisma connection failed:', error);
    process.exit(1);
  });