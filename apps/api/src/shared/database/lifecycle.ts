import { getDbClient } from '../db/prisma.js';

export interface DatabaseReadinessResult {
  ok: boolean;
  latencyMs: number;
}

export async function connectDatabase(): Promise<void> {
  await getDbClient().connect();
}

export async function disconnectDatabase(): Promise<void> {
  await getDbClient().close();
}

export async function checkDatabaseReadiness(): Promise<DatabaseReadinessResult> {
  const start = Date.now();
  try {
    const client = getDbClient();
    await client.execute(client.raw.sql`SELECT 1`.affectedCount().build());
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
