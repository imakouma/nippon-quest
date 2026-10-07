import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// CI/コンテナに同梱済みの Chromium があればそれを使う（playwright install 不要）
const preinstalled = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => existsSync(p));
// 開発用 preview と共有すると、別タスクの終了・再ビルドでE2E中に接続が切れる。
const port = Number(process.env.E2E_PORT ?? 4174);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  // Phaser/WebGL と4,000問超のJSONを複数ブラウザで同時に初期化すると、
  // CI の小さいCPUでは正常な画面までタイムアウトする。ゲームE2Eは直列で再現性を優先する。
  workers: 1,
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 960, height: 540 },
    ...(preinstalled ? { launchOptions: { executablePath: preinstalled } } : {}),
  },
  webServer: {
    command: `pnpm build && pnpm exec vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    port,
    // 通常は検査ごとに本番previewを作り直す。手元で既に最新版を起動済みの場合だけ明示的に再利用する。
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
    // Full content validation, typechecking, and the production bundle can take
    // more than two minutes on a cold start as the content set grows.
    timeout: 240_000,
  },
});
