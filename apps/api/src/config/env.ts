/**
 * Environment configuration — validated at boot time.
 * The server WILL NOT start if required environment variables are missing or malformed.
 * No secrets are logged or exposed in error messages.
 */

import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid PostgreSQL connection URL')
    .optional()
    .or(z.literal('')),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  API_VERSION: z.string().default('0.0.0'),
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Parses and validates an environment record against `envSchema`.
 * Throws a descriptive Error if validation fails.
 */
export function parseEnv(rawEnv: Record<string, string | undefined>): AppEnv {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }
  return result.data;
}

function validateEnv(): AppEnv {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error(
      '❌ Environment validation failed. The server cannot start with invalid configuration.\n',
      result.error.format(),
    );
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
