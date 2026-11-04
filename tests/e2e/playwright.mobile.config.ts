import { defineConfig, devices } from '@playwright/test';
import base from '../../playwright.config';

export default defineConfig({
  ...base,
  testDir: '.',
  testMatch: 'question-mobile.spec.ts',
  testIgnore: [],
  use: { ...base.use, launchOptions: {} },
  projects: [
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    { name: 'android-chromium', use: { ...devices['Pixel 5'], browserName: 'chromium' } },
  ],
});
