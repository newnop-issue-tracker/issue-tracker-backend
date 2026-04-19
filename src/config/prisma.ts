import { PrismaClient } from '@prisma/client';
import { isDevelopment } from './env';

/**
 * Prisma client singleton.
 *
 * In dev, Next.js-style hot reload can create multiple instances and exhaust
 * DB connections. We attach to `globalThis` to reuse the same client.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });

if (isDevelopment) {
  globalForPrisma.prisma = prisma;
}
