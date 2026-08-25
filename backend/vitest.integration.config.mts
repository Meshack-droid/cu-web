import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    // Integration tests share one MySQL connection pool and mutate shared
    // reference data (test users, role assignments) — run them serially to
    // avoid cross-test races, unlike the pure unit tests above.
    fileParallelism: false,
  },
});
