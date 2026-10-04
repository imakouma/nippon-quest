/** 旧問題画像をローカル化し、成功した問題だけ視覚依存フラグを解除する。 */
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';
import type { StagedLegacyQuestion } from './import-legacy-questions';

const sourceIndex = process.argv.indexOf('--source');
const sourceRoot = sourceIndex >= 0 ? process.argv[sourceIndex + 1] : undefined;
if (!sourceRoot) throw new Error('--source /path/to/autonomy-game が必要です');
const checkedSourceRoot: string = sourceRoot;
const sourcePublicRoot = resolve(checkedSourceRoot, 'public');
const stagedPath = resolve('imports/legacy-questions/staged.json');
const staged = JSON.parse(await readFile(stagedPath, 'utf8')) as StagedLegacyQuestion[];
const output = resolve('assets/questions/legacy');
await mkdir(output, { recursive: true });
const urls = [...new Set(staged.flatMap((q) => (q.legacy.sourceImageUrl ? [q.legacy.sourceImageUrl] : [])))];
const localized = new Map<string, string>();
const failures: Array<{ url: string; reason: string }> = [];

async function obtain(url: string): Promise<void> {
  const rawExt = extname(new URL(url, 'https://legacy.local').pathname).toLowerCase();
  const ext = ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(rawExt) ? rawExt : '.png';
  const name = `${createHash('sha256').update(url).digest('hex').slice(0, 16)}${ext}`;
  const target = join(output, name);
  try {
    if (url.startsWith('/')) {
      const source = resolve(sourcePublicRoot, `.${url}`);
      const rel = relative(sourcePublicRoot, source);
      if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('source path escapes public directory');
      const sourceStat = await stat(source);
      if (!sourceStat.isFile() || sourceStat.size === 0 || sourceStat.size > 8_000_000)
        throw new Error(`bad local image: ${sourceStat.size} bytes`);
      await copyFile(source, target);
    } else {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get('content-type') ?? '';
      if (!type.startsWith('image/')) throw new Error(`not image: ${type}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length === 0 || bytes.length > 8_000_000) throw new Error(`bad size: ${bytes.length}`);
      await writeFile(target, bytes);
    }
    localized.set(url, `questions/legacy/${name}`);
  } catch (error) {
    failures.push({ url, reason: error instanceof Error ? error.message : String(error) });
  }
}

for (let index = 0; index < urls.length; index += 20)
  await Promise.all(urls.slice(index, index + 20).map(obtain));

let updated = 0;
for (const q of staged) {
  const url = q.legacy.sourceImageUrl;
  const image = url && localized.get(url);
  if (!image) continue;
  q.payload = { ...(q.payload as object), promptImage: image };
  q.legacy.reviewFlags = q.legacy.reviewFlags.filter(
    (flag) => flag !== 'legacy-image-reference' && flag !== 'external-visual-context',
  );
  updated++;
}
await writeFile(stagedPath, `${JSON.stringify(staged, null, 2)}\n`);
await writeFile(
  resolve('imports/legacy-questions/image-report.json'),
  `${JSON.stringify({ uniqueUrls: urls.length, localized: localized.size, questionsUpdated: updated, failures }, null, 2)}\n`,
);
console.log(
  `legacy images: ${localized.size}/${urls.length} assets; ${updated} questions updated; ${failures.length} failed`,
);
