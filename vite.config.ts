import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { existsSync, statSync, createReadStream, cpSync } from 'node:fs';

const root = fileURLToPath(new URL('.', import.meta.url));

/**
 * content/ assets/ schemas/ をプロジェクト直下に置いたまま、
 * dev では /content/... で配信し、build では dist/ にコピーする。
 * → 問題作成者はファイルを置いてリロードするだけで反映される（docs/01 §3.3 ルール4）。
 */
function serveRootDirs(dirs: string[]): Plugin {
  const mime: Record<string, string> = {
    '.json': 'application/json',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.tmj': 'application/json',
    '.tsj': 'application/json',
  };
  return {
    name: 'nihonquest:serve-root-dirs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0] ?? '';
        const dir = dirs.find((d) => url.startsWith(`/${d}/`));
        if (!dir) return next();
        const file = resolve(root, decodeURIComponent(url.slice(1)));
        if (!file.startsWith(resolve(root, dir)) || !existsSync(file) || !statSync(file).isFile())
          return next();
        const ext = file.slice(file.lastIndexOf('.'));
        res.setHeader('Content-Type', mime[ext] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      for (const d of dirs) {
        const src = resolve(root, d);
        if (existsSync(src)) cpSync(src, resolve(root, 'dist', d), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [preact(), serveRootDirs(['content', 'assets', 'schemas', 'maps'])],
  resolve: { alias: { '@': resolve(root, 'src') } },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        playground: resolve(root, 'playground.html'),
        editor: resolve(root, 'editor.html'),
      },
      output: {
        // Phaser は大きく更新頻度が低い。ゲーム本体と分離して、更新時にブラウザキャッシュを再利用する。
        manualChunks(id) {
          if (id.includes('/node_modules/.pnpm/phaser@')) return 'phaser';
        },
      },
    },
  },
  server: { port: 5173, open: false },
});
