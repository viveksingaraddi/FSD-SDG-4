/**
 * Server entry point — binds the Express application to a TCP port.
 */

import { createApp } from './app.js';
import { env } from './config/env.js';
import { disconnectDatabase } from './shared/database/index.js';
import { logger } from './shared/logging/logger.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      version: env.API_VERSION,
    },
    'FSD-SDG-4 API server started',
  );
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────

function gracefulShutdown(signal: string): void {
  logger.info({ signal }, 'Received shutdown signal — closing server gracefully');

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during HTTP server shutdown');
      process.exit(1);
    }

    try {
      await disconnectDatabase();
      logger.info('Server and database connections closed cleanly');
      process.exit(0);
    } catch (dbErr) {
      logger.error({ err: dbErr }, 'Error disconnecting database during shutdown');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
