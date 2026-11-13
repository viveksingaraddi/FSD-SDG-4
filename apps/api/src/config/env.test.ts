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
    expect(parsed.APP_BASE_URL).toBe('http://localhost:5173');
    expect(parsed.MAIL_HOST).toBe('smtp.gmail.com');
    expect(parsed.MAIL_PORT).toBe(465);
    expect(parsed.MAIL_SECURE).toBe(true);
    expect(parsed.MAIL_USER).toBe('');
    expect(parsed.MAIL_APP_PASSWORD).toBe('');
    expect(parsed.MAIL_FROM_NAME).toBe('FSD-SDG-4 Quality Education');
  });

  it('accepts a valid explicit configuration', () => {
    const parsed = parseEnv({
      NODE_ENV: 'test',
      PORT: '4000',
      LOG_LEVEL: 'silent',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/fsd_sdg4_test',
      CORS_ORIGIN: 'http://localhost:5173',
      API_VERSION: '0.1.0',
      APP_BASE_URL: 'https://app.fsd-sdg4.edu',
      MAIL_HOST: 'smtp.gmail.com',
      MAIL_PORT: '587',
      MAIL_SECURE: 'false',
      MAIL_USER: 'notifications@fsd-sdg4.edu',
      MAIL_APP_PASSWORD: 'abcd-efgh-ijkl-mnop',
      MAIL_FROM_NAME: 'FSD-SDG-4 Notifications',
    });

    expect(parsed.NODE_ENV).toBe('test');
    expect(parsed.PORT).toBe(4000);
    expect(parsed.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/fsd_sdg4_test');
    expect(parsed.APP_BASE_URL).toBe('https://app.fsd-sdg4.edu');
    expect(parsed.MAIL_PORT).toBe(587);
    expect(parsed.MAIL_SECURE).toBe(false);
    expect(parsed.MAIL_USER).toBe('notifications@fsd-sdg4.edu');
    expect(parsed.MAIL_APP_PASSWORD).toBe('abcd-efgh-ijkl-mnop');
    expect(parsed.MAIL_FROM_NAME).toBe('FSD-SDG-4 Notifications');
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
