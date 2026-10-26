import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { DATA_AUDIT_TEST_FILES } from './vitest.test-groups';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: [...DATA_AUDIT_TEST_FILES],
    environment: 'node',
    testTimeout: 15_000,
  },
});
