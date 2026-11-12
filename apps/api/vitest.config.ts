import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.integration.test.ts'],
    env: {
      NODE_ENV: 'test',
      PORT: '3002',
      LOG_LEVEL: 'silent',
      API_VERSION: '0.0.0-test',
      CORS_ORIGIN: 'http://localhost:5173',
    },
  },
});
