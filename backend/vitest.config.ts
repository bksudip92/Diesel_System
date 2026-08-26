import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://diesel:diesel@localhost:5433/diesel_system_test',
    },
    testTimeout: 30_000,
    // Test files share one database — run them sequentially.
    fileParallelism: false,
  },
});
