import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb',
      JWT_SECRET: 'test-secret',
      LOG_LEVEL: 'silent',
    },
    setupFiles: ['./src/__tests__/setup.ts'],
    clearMocks: true,
    exclude: [...configDefaults.exclude, 'dist/**'],
  },
});
