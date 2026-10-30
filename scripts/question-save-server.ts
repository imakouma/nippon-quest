import { randomUUID } from 'node:crypto';
import { readFileSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { replaceQuestionForSave } from '../src/tools/questionSave';

export function saveQuestion(
  root: string,
  data: { file: string; expected: unknown; id: string; question: unknown },
) {
  if (
    !/^questions\/(kokugo|sansu|rika|shakai|seikatsu|eigo)\/g[1-6]\/[a-z0-9-]+\/set-\d{3}\.json$/.test(
      data.file,
    )
  ) {
    throw new Error('保存先が不正です');
  }
  const contentRoot = realpathSync(resolve(root, 'content/questions'));
  const path = realpathSync(resolve(root, 'content', data.file));
  if (!path.startsWith(contentRoot + sep)) throw new Error('保存先が不正です');
  const source: unknown = JSON.parse(readFileSync(path, 'utf8'));
  const next = replaceQuestionForSave(source, data.expected, data.id, data.question);
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temp, `${JSON.stringify(next, null, 2)}\n`, { flag: 'wx', mode: statSync(path).mode });
    renameSync(temp, path);
  } finally {
    try {
      unlinkSync(temp);
    } catch {
      /* rename removes the temporary file */
    }
  }
  return next;
}

export function questionSaveMiddleware(root: string) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url?.split('?')[0] !== '/__nq/save-question') return next();
    const host = req.headers.host ?? '';
    const origin = req.headers.origin;
    if (
      req.method !== 'POST' ||
      !/^127\.0\.0\.1:\d+$/.test(host) ||
      origin !== `http://${host}` ||
      req.headers['x-nq-save'] !== '1'
    ) {
      res.writeHead(403).end();
      return;
    }
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const result = saveQuestion(root, JSON.parse(body));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ questions: result }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : '保存できませんでした' }));
      }
    });
  };
}
