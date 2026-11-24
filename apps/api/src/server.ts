/**
 * Server entry point — binds the Express application to a TCP port.
 */

import { createApp } from './app.js';
import { env } from './config/env.js';
import { isMailConfigured, verifyMailConnection } from './modules/mail/mail.service.js';
import { disconnectDatabase } from './shared/database/index.js';
import { logger } from './shared/logging/logger.js';

const app = createApp();

export { app };
export default app;

if (!process.env['VERCEL']) {
  const server = app.listen(env.PORT, async () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        version: env.API_VERSION,
      },
      'EDVARQ API server started',
    );

    if (isMailConfigured()) {
      const check = await verifyMailConnection();
      if (check.ok) {
        logger.info(
          {
            host: env.MAIL_HOST,
            port: env.MAIL_PORT,
            user: env.MAIL_USER,
          },
          'SMTP mail connection verified successfully (Nodemailer transporter.verify())',
        );
      } else {
        logger.error(
          {
            host: env.MAIL_HOST,
            port: env.MAIL_PORT,
            user: env.MAIL_USER,
            error: check.error,
          },
          'SMTP connection verification failed — automatic emails will fail until resolved',
        );
      }
    } else {
      logger.warn(
        'SMTP mail delivery unconfigured (MAIL_USER / MAIL_APP_PASSWORD empty) — operating in fallback link mode',
      );
    }
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
}
