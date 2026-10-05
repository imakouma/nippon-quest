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
  esbuild: { sourcemap: false },
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
          // 手描きドット絵は TypeScript の宣言データが大きい。機能コードと分離し、
          // 県の絵を直しただけでゲーム進行コードのキャッシュを無効にしない。
          const monster = id.match(/\/src\/rendering\/monsters\/([^/]+)\.ts$/)?.[1];
          if (monster && monster !== 'index' && monster !== 'design') {
            const first = monster[0] ?? 'z';
            const bucket = first <= 'f' ? 'af' : first <= 'l' ? 'gl' : first <= 'r' ? 'mr' : 'sz';
            return `art-monsters-${bucket}`;
          }
          if (id.includes('/src/rendering/motifArt/buildings.ts')) return 'art-motifs-buildings';
          if (id.includes('/src/rendering/motifArt/nature.ts')) return 'art-motifs-nature';
          if (id.includes('/src/rendering/motifArt/events.ts')) return 'art-motifs-events';
          if (id.includes('/src/rendering/itemIcons.ts') || id.includes('/src/rendering/costumes.ts'))
            return 'art-items';
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
    // 初回の「はじめから／つづきから」で大きい Scene を変換すると、
    // 低速環境では dynamic import がタイムアウトする。サーバー起動時に
    // 変換を済ませ、タイトルからの遷移を安定させる。
    warmup: {
      clientFiles: [
        './src/scenes/gameplayLoader.ts',
        './src/scenes/entries/overworld.ts',
        './src/scenes/entries/battle.ts',
        './src/scenes/Overworld.ts',
        './src/scenes/Battle.ts',
      ],
    },
  },
});
