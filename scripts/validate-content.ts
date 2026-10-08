/**
 * content/ 全体の検証。CI と手元の両方で使う。
 *  (a) スキーマ検証  (b) id 重複  (c) 参照切れ  (d) 問題 JSON の payload 検証
 *  (e) 画像キー → assets/ の実ファイル存在（warning）
 * 問題があれば非0で終了。
 */
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { findBrokenReferences, loadContent, type FileReader } from '../src/core/content/loader';
import { academicReviewLedgerSchema, isAcademicReviewExpired } from '../src/questions/academicReview';
import { questionBaseSchema } from '../src/questions/contracts';
import { getRenderer } from '../src/questions/renderers/registry';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT = `${ROOT}content/`;

// manifest が古いと検証がすり抜けるので、必ず作り直す
execSync('pnpm gen:manifest', { cwd: ROOT, stdio: 'inherit' });

const read: FileReader = async (rel) => JSON.parse(readFileSync(CONTENT + rel, 'utf8'));
const errors: string[] = [];
const warnings: string[] = [];
const information: string[] = [];
const assetFields = new Set(['image', 'promptImage', 'audio', 'promptAudio']);

interface AssetReference {
  path: string;
  optional: boolean;
}

function referencedAssets(value: unknown): AssetReference[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  return Object.entries(record).flatMap(([key, child]) => {
    if (!assetFields.has(key) || typeof child !== 'string') return referencedAssets(child);
    const optional =
      key === 'audio' || key === 'promptAudio' || (key === 'image' && typeof record.picture === 'string');
    return [{ path: child, optional }];
  });
}

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
  let optionalQuestionAssetsMissing = 0;
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
      if (!p.success) {
        errors.push(
          `${file}[${i}] (${id}): payload が ${type} のスキーマに合いません: ${p.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`,
        );
        return;
      }
      for (const asset of referencedAssets(p.data)) {
        if (existsSync(`${ROOT}assets/${asset.path}`)) continue;
        if (asset.optional) optionalQuestionAssetsMissing += 1;
        else errors.push(`${file}[${i}] (${id}): assets/${asset.path} がありません`);
      }
    });
  }
  if (optionalQuestionAssetsMissing > 0)
    information.push(
      `問題の任意アセット: ${optionalQuestionAssetsMissing} 件は未配置（読み上げ・生成絵へフォールバック）`,
    );

  // 人間が承認した教材とその根拠を固定する。承認後の無審査変更はエラーにする。
  const ledgerPath = `${CONTENT}quality/academic-reviews.json`;
  const ledger = academicReviewLedgerSchema.safeParse(JSON.parse(readFileSync(ledgerPath, 'utf8')));
  if (!ledger.success) {
    errors.push(
      `quality/academic-reviews.json: ${ledger.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`,
    );
  } else {
    const sourceIds = new Set(ledger.data.sources.map((source) => source.id));
    for (const source of ledger.data.sources) {
      if (isAcademicReviewExpired(source.checkedAt, ledger.data.policy.reviewIntervalMonths))
        warnings.push(
          `academic review: 出典 "${source.id}" の確認期限が切れています（確認日 ${source.checkedAt}）`,
        );
    }
    const productionFiles = new Set(
      content.questionFiles.filter((file) => !file.startsWith('questions/_samples/')),
    );
    const approved = new Set<string>();
    for (const review of ledger.data.reviews) {
      if (!productionFiles.has(review.file)) {
        errors.push(`academic review: 存在しない問題ファイル "${review.file}"`);
        continue;
      }
      if (approved.has(review.file)) errors.push(`academic review: "${review.file}" の承認が重複しています`);
      approved.add(review.file);
      if (isAcademicReviewExpired(review.reviewedAt, ledger.data.policy.reviewIntervalMonths))
        warnings.push(
          `academic review: "${review.file}" の再レビュー期限が切れています（確認日 ${review.reviewedAt}）`,
        );
      for (const sourceId of review.sourceIds)
        if (!sourceIds.has(sourceId))
          errors.push(`academic review: "${review.file}" が未知の出典 "${sourceId}" を参照しています`);
      const digest = createHash('sha256')
        .update(readFileSync(CONTENT + review.file))
        .digest('hex');
      if (digest !== review.sha256)
        errors.push(`academic review: "${review.file}" は承認後に変更されています。再レビューしてください`);
    }
    const pending = productionFiles.size - approved.size;
    if (pending > 0)
      information.push(
        `学術レビュー: ${pending}/${productionFiles.size} 問題ファイルが人による承認待ち（承認済み ${approved.size}）。` +
          ' pnpm audit:academic-review で確認順を更新できます',
      );
  }

  // imageKey / spriteKey は絵の識別子であり、外部 PNG の必須パスではない。
  // 現在は mon/item/motif/char/face の全系統に決定的なゲーム内描画があり、
  // 外部 PNG は将来差し替えるための任意オーバーライドとして扱う。
  const keyToPath = (key: string): string | null => {
    const [prefix, ...rest] = key.split('.');
    const id = rest.join('.');
    switch (prefix) {
      case 'char':
        return `assets/sprites/characters/${id}.png`;
      case 'mon':
        return null;
      case 'face':
        return `assets/portraits/${id}.png`;
      case 'item':
        return null;
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
  let optionalImageOverridesMissing = 0;
  for (const k of keys) {
    const p = keyToPath(k);
    if (p && !existsSync(ROOT + p)) optionalImageOverridesMissing += 1;
  }
  if (optionalImageOverridesMissing > 0)
    information.push(
      `任意の外部画像差し替え: ${optionalImageOverridesMissing} 件は未配置（ゲーム内生成絵があるため欠損ではありません）`,
    );

  console.log(
    `content: ${content.areas.size} areas / ${content.monsters.size} monsters / ${content.items.size} items / ${content.skills.size} skills / questions in ${content.questionFiles.length} files`,
  );
}

if (information.length) {
  console.log('\nℹ information:');
  for (const item of information) console.log('  ' + item);
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
