import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const preinstalled = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((path) => existsSync(path));
const port = Number(process.env.E2E_PORT ?? 4174);

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  workers: 1,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`,
    viewport: { width: 960, height: 540 },
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(preinstalled ? { launchOptions: { executablePath: preinstalled } } : {}),
  },
  webServer: {
    command: `pnpm exec vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    port,
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
    timeout: 30_000,
  },
});
