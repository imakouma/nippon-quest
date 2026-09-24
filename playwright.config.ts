import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// CI/コンテナに同梱済みの Chromium があればそれを使う（playwright install 不要）
const preinstalled = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => existsSync(p));

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 960, height: 540 },
    ...(preinstalled ? { launchOptions: { executablePath: preinstalled } } : {}),
  },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
