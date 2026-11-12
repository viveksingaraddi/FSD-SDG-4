import { prisma } from '../db/prisma.js';

export interface DatabaseReadinessResult {
  ok: boolean;
  latencyMs: number;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export async function checkDatabaseReadiness(): Promise<DatabaseReadinessResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch {
    return {
      ok: false,
      latencyMs: Date.now() - start,
    };
  }
}
