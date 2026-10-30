import { randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  lstatSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { folderStateSchema, type FolderState } from '../src/tools/folderLayout';
const stateFile = (root: string) => join(root, '.nq-folder-state.json');

export function readFolderState(root: string): FolderState {
  const path = stateFile(root);
  if (!existsSync(path))
    return { revision: 0, layout: { folders: [], assignments: {}, hidden: [] }, snapshots: [] };
  if (!lstatSync(path).isFile()) throw new Error('フォルダ構成の保存先が不正です');
  return folderStateSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
}

export function writeFolderState(root: string, expected: number, input: unknown): FolderState {
  const next = folderStateSchema.parse(input);
  const lock = `${stateFile(root)}.lock`;
  const fd = openSync(lock, 'wx');
  const temp = `${stateFile(root)}.${randomUUID()}.tmp`;
  try {
    const current = readFolderState(root);
    if (current.revision !== expected || next.revision !== expected)
      throw new Error('他の画面で変更されました。再読み込みしてください');
    const saved = { ...next, revision: expected + 1 };
    writeFileSync(temp, `${JSON.stringify(saved, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    renameSync(temp, stateFile(root));
    return saved;
  } finally {
    closeSync(fd);
    if (existsSync(temp)) unlinkSync(temp);
    unlinkSync(lock);
  }
}

export function folderSaveMiddleware(root: string) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url?.split('?')[0] !== '/__nq/folder-state') return next();
    const host = req.headers.host ?? '';
    if (
      !/^127\.0\.0\.1:\d+$/.test(host) ||
      req.headers.origin !== `http://${host}` ||
      req.headers['x-nq-save'] !== '1' ||
      !['POST'].includes(req.method ?? '')
    ) {
      res.writeHead(403).end();
      return;
    }
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 4 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body) as { action: string; expected?: number; state?: unknown };
        const result =
          data.action === 'read'
            ? readFolderState(root)
            : data.action === 'write' && Number.isSafeInteger(data.expected)
              ? writeFolderState(root, data.expected!, data.state)
              : null;
        if (!result) throw new Error('操作が不正です');
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : '保存できませんでした' }));
      }
    });
  };
}
