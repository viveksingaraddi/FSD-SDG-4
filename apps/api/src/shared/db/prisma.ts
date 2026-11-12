/**
 * Prisma Client singleton for FSD-SDG-4.
 * Phase 5: Database connection foundation (no auth or tenant middleware yet;
 * tenant-scoping Prisma extension is scheduled for Phase 6–7).
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
