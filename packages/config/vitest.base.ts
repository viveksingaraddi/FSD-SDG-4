import type { UserConfig } from 'vitest/config';

/**
 * Shared Vitest base configuration.
 * Individual workspaces extend this with defineConfig({ test: { ...vitestBase.test, ... } })
 */
export const vitestBase: UserConfig['test'] = {
  globals: false,
  environment: 'node',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
  },
};
