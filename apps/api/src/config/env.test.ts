import { describe, expect, it } from 'vitest';
import { envSchema, parseEnv } from './env.js';

describe('API environment validation', () => {
  it('applies safe defaults when optional environment variables are omitted', () => {
    const parsed = parseEnv({});
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.PORT).toBe(3001);
    expect(parsed.LOG_LEVEL).toBe('info');
    expect(parsed.CORS_ORIGIN).toBe('http://localhost:5173');
    expect(parsed.API_VERSION).toBe('0.0.0');
  });

  it('accepts a valid explicit configuration', () => {
    const parsed = parseEnv({
      NODE_ENV: 'test',
      PORT: '4000',
      LOG_LEVEL: 'silent',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/fsd_sdg4_test',
      CORS_ORIGIN: 'http://localhost:5173',
      API_VERSION: '0.1.0',
    });

    expect(parsed.NODE_ENV).toBe('test');
    expect(parsed.PORT).toBe(4000);
    expect(parsed.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/fsd_sdg4_test');
  });

  it('rejects an invalid NODE_ENV value', () => {
    const result = envSchema.safeParse({ NODE_ENV: 'invalid_env' });
    expect(result.success).toBe(false);
    expect(() => parseEnv({ NODE_ENV: 'invalid_env' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects an out-of-range or non-numeric PORT', () => {
    expect(envSchema.safeParse({ PORT: '70000' }).success).toBe(false);
    expect(envSchema.safeParse({ PORT: '0' }).success).toBe(false);
    expect(envSchema.safeParse({ PORT: 'not-a-number' }).success).toBe(false);
  });

  it('rejects malformed CORS_ORIGIN and DATABASE_URL values', () => {
    expect(envSchema.safeParse({ CORS_ORIGIN: 'not-a-url' }).success).toBe(false);
    expect(envSchema.safeParse({ DATABASE_URL: 'not-a-valid-connection-url' }).success).toBe(false);
  });
});
