import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, realpathSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

export const integrationBranch = 'codex/publish-problem-review-20261116';
const stampName = '.integrated-preview.json';
const git = (root: string, ...args: string[]) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

export function integrationRoot(root: string): string {
  const entry = git(root, 'worktree', 'list', '--porcelain')
    .split('\n\n')
    .find((block) => block.split('\n').includes(`branch refs/heads/${integrationBranch}`));
  if (!entry) throw new Error(`統合ブランチ ${integrationBranch} の worktree がありません。`);
  return realpathSync(entry.split('\n')[0]!.slice('worktree '.length));
}

export function assertIntegrationRoot(root: string) {
  if (realpathSync(root) !== integrationRoot(root))
    throw new Error('4174 は統合版専用です。pnpm nrd を使うか、作業版は4175以降で起動してください。');
}

export function integratedPreview(): Plugin {
  let root: string;
  let stamp: string;
  let index: string;
  let building: Promise<void> | undefined;

  async function ensureCurrent() {
    if (building) return building;
    building = (async () => {
      assertIntegrationRoot(root);
      const head = git(root, 'rev-parse', 'HEAD');
      let saved: { head?: string; root?: string; modified?: number } = {};
      try {
        saved = JSON.parse(readFileSync(stamp, 'utf8'));
        if (
          saved.head === head &&
          saved.root === realpathSync(root) &&
          saved.modified === statSync(index).mtimeMs
        )
          return;
      } catch {
        /* Missing build files or an invalid stamp require a fresh build. */
      }
      if (git(root, 'status', '--porcelain', '--untracked-files=no'))
        throw new Error('統合フォルダに未コミット変更があります。コミット・検査後に再読み込みしてください。');
      console.log(`統合版 ${head.slice(0, 8)} をビルドしています…`);
      await new Promise<void>((accept, reject) => {
        const child = spawn('pnpm', ['build'], {
          cwd: root,
          env: { ...process.env, VITE_NQ_DEV_TOOLS: '1' },
          stdio: 'inherit',
        });
        child.on('error', reject);
        child.on('exit', (code) =>
          code === 0 ? accept() : reject(new Error('統合版のビルドが失敗しました。')),
        );
      });
      if (git(root, 'rev-parse', 'HEAD') !== head)
        throw new Error('ビルド中に統合コミットが更新されました。再読み込みしてください。');
      writeFileSync(
        stamp,
        JSON.stringify({ head, root: realpathSync(root), modified: statSync(index).mtimeMs }),
      );
    })();
    try {
      await building;
    } finally {
      building = undefined;
    }
  }

  return {
    name: 'nihonquest:integrated-preview',
    configResolved(config) {
      root = config.root;
      stamp = resolve(root, config.build.outDir, stampName);
      index = resolve(root, config.build.outDir, 'index.html');
    },
    configureServer(server) {
      if (server.config.server.port === 4174)
        throw new Error('4174 では開発サーバーを起動できません。pnpm nrd を使ってください。');
    },
    configurePreviewServer(server) {
      if (server.config.preview.port !== 4174) return;
      assertIntegrationRoot(root);
      // Bind the port before building so concurrent launchers reuse this server.
      server.middlewares.use((req, res, next) => {
        void ensureCurrent()
          .then(() => {
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('X-NQ-Commit', git(root, 'rev-parse', 'HEAD'));
            if (req.url === '/__integrated-preview') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ root: realpathSync(root), head: git(root, 'rev-parse', 'HEAD') }));
            } else next();
          })
          .catch((error: Error) => {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(error.message);
          });
      });
    },
  };
}
