import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
    // 4,000問超の教材と全ドット絵を走査する監査は、並列実行時だけ既定5秒を超える。
    // 検査内容は減らさず、暴走も検知できる有限の上限を持たせる。
    testTimeout: 15_000,
  },
});
