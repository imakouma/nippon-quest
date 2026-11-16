import { preview } from 'vite';
import { integrationRoot } from './integrated-preview';

const root = integrationRoot(process.cwd());
try {
  const response = await fetch('http://127.0.0.1:4174/__integrated-preview');
  const running = await response.json();
  if (running.root !== root) throw new Error('4174 は別のサーバーが使用しています。');
  console.log('統合版プレビュー: http://127.0.0.1:4174/playground.html');
} catch (error) {
  if (!(error instanceof TypeError)) throw error;
  const server = await preview({ root, preview: { host: '127.0.0.1', port: 4174, strictPort: true } });
  server.printUrls();
}
