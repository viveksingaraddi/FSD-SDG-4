/**
 * Server entry point — binds the Express application to a TCP port.
 */

import { createApp } from './app.js';
import { logger } from './lib/logger.js';
import { env } from './config/env.js';

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

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during graceful shutdown');
      process.exit(1);
    }
    logger.info('Server closed cleanly');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
