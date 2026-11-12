/**
 * Structured Pino logger — application-wide singleton.
 * Log level controlled by LOG_LEVEL environment variable.
 */

import { pino } from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
});
