import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const preinstalled = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((path) => existsSync(path));

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4174',
    viewport: { width: 960, height: 540 },
    ...(preinstalled ? { launchOptions: { executablePath: preinstalled } } : {}),
  },
});
