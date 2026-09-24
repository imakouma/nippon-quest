/**
 * content/ 全体の検証。CI と手元の両方で使う。
 *  (a) スキーマ検証  (b) id 重複  (c) 参照切れ  (d) 問題 JSON の payload 検証
 *  (e) 画像キー → assets/ の実ファイル存在（warning）
 * 問題があれば非0で終了。
 */
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findBrokenReferences, loadContent, type FileReader } from '../src/core/content/loader';
import { questionBaseSchema } from '../src/questions/contracts';
import { getRenderer } from '../src/questions/renderers/registry';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT = `${ROOT}content/`;

// manifest が古いと検証がすり抜けるので、必ず作り直す
execSync('pnpm -s gen:manifest', { cwd: ROOT, stdio: 'inherit' });

const read: FileReader = async (rel) => JSON.parse(readFileSync(CONTENT + rel, 'utf8'));
const errors: string[] = [];
const warnings: string[] = [];

const content = await loadContent(read, {
  onDuplicate: (id, file) => errors.push(`${file}: id "${id}" が重複しています`),
}).catch((e: Error) => {
  errors.push(e.message);
  return null;
});

if (content) {
  errors.push(...findBrokenReferences(content));

  // 問題 JSON
  const seen = new Map<string, string>();
  for (const file of content.questionFiles) {
    const raw = JSON.parse(readFileSync(CONTENT + file, 'utf8'));
    if (!Array.isArray(raw)) {
      errors.push(`${file}: 問題ファイルは配列である必要があります`);
      continue;
    }
    raw.forEach((q: unknown, i: number) => {
      const base = questionBaseSchema.safeParse(q);
      if (!base.success) {
        errors.push(
          `${file}[${i}]: ${base.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`,
        );
        return;
      }
      const { id, type, payload, unit } = base.data;
      if (seen.has(id)) errors.push(`${file}[${i}]: 問題 id "${id}" が重複（${seen.get(id)}）`);
      seen.set(id, file);
      if (!content.units.has(unit) && !file.startsWith('questions/_samples/'))
        warnings.push(`${file}[${i}]: unit "${unit}" が content/units.json にありません`);
      const r = getRenderer(type);
      if (!r) {
        errors.push(`${file}[${i}]: 未登録の問題タイプ "${type}"`);
        return;
      }
      const p = r.schema.safeParse(payload);
      if (!p.success)
        errors.push(
          `${file}[${i}] (${id}): payload が ${type} のスキーマに合いません: ${p.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`,
        );
    });
  }

  // 画像キー（docs/03 §1 の命名規則）→ ファイル存在チェック（warning）
  const keyToPath = (key: string): string | null => {
    const [prefix, ...rest] = key.split('.');
    const id = rest.join('.');
    switch (prefix) {
      case 'char':
        return `assets/sprites/characters/${id}.png`;
      case 'mon':
        return id.endsWith('.field')
          ? `assets/sprites/monsters/${id.replace(/\.field$/, '')}-field.png`
          : `assets/sprites/monsters/${id}.png`;
      case 'face':
        return `assets/portraits/${id}.png`;
      case 'item':
        return `assets/items/${id}.png`;
      case 'motif': {
        const [area, ...m] = id.split('.');
        return `assets/motifs/${area}/${m.join('.')}.png`;
      }
      default:
        return null;
    }
  };
  const keys = new Set<string>();
  for (const m of content.monsters.values()) keys.add(m.spriteKey);
  for (const it of content.items.values()) keys.add(it.iconKey);
  for (const a of content.areas.values()) {
    for (const m of a.motifs) keys.add(m.imageKey);
    for (const n of a.town?.npcs ?? []) {
      keys.add(n.spriteKey);
      if (n.face) keys.add(n.face);
    }
  }
  for (const k of keys) {
    const p = keyToPath(k);
    if (p && !existsSync(ROOT + p)) warnings.push(`画像がまだありません: ${k} → ${p}`);
  }

  console.log(
    `content: ${content.areas.size} areas / ${content.monsters.size} monsters / ${content.items.size} items / ${content.skills.size} skills / questions in ${content.questionFiles.length} files`,
  );
}

if (warnings.length) {
  console.log(`\n⚠ warnings (${warnings.length}):`);
  for (const w of warnings.slice(0, 40)) console.log('  ' + w);
  if (warnings.length > 40) console.log(`  ... 他 ${warnings.length - 40} 件`);
}
if (errors.length) {
  console.error(`\n✖ errors (${errors.length}):`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('\n✔ validate:content OK');
