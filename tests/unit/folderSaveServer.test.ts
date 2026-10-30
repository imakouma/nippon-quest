import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { folderSaveMiddleware, readFolderState, writeFolderState } from '../../scripts/folder-save-server';

const roots: string[] = [];
const root = () => {
  const path = mkdtempSync(join(tmpdir(), 'nq-folder-test-'));
  roots.push(path);
  return path;
};
afterEach(() => {
  for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe('フォルダ構成の保存', () => {
  it('保存と再読込ができ、古い版からの上書きを拒否する', () => {
    const dir = root();
    const initial = readFolderState(dir);
    const next = { ...initial, layout: { ...initial.layout, hidden: ['sansu:g1:unit'] } };
    expect(writeFolderState(dir, 0, next).revision).toBe(1);
    expect(readFolderState(dir).layout.hidden).toEqual(['sansu:g1:unit']);
    expect(() => writeFolderState(dir, 0, next)).toThrow(/変更/);
    expect(readFolderState(dir).revision).toBe(1);
  });

  it('破損した保存ファイルを上書きしない', () => {
    const dir = root();
    const path = join(dir, '.nq-folder-state.json');
    writeFileSync(path, '{broken');
    expect(() => readFolderState(dir)).toThrow();
    expect(readFileSync(path, 'utf8')).toBe('{broken');
  });

  it('外部の Origin からの保存要求を拒否する', async () => {
    const dir = root();
    const middleware = folderSaveMiddleware(dir);
    const server = createServer((req, res) => middleware(req, res, () => res.writeHead(404).end()));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('サーバー起動に失敗');
      const response = await fetch(`http://127.0.0.1:${address.port}/__nq/folder-state`, {
        method: 'POST',
        headers: { Origin: 'https://example.com', 'x-nq-save': '1', 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'write', expected: 0, state: readFolderState(dir) }),
      });
      expect(response.status).toBe(403);
      expect(readFolderState(dir).revision).toBe(0);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
