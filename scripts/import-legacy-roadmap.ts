/** 旧ロードマップの静的ノード定義を、現行の単元契約へ安全に変換する。 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { unitSchema, type Unit } from '../src/core/content/schemas';
import type { Grade, Subject } from '../src/questions/contracts';

interface LegacyRoadmapRow {
  legacyNode: string;
  grade: Grade;
  order: number;
  title: string;
  subject: Subject;
  sourceFile: string;
}

const FILES = ['roadmapDatabase.ts', 'scienceRoadmapNodes.ts', 'socialRoadmapNodes.ts'];
const FALLBACK_TITLES: Readonly<Record<string, string>> = {
  jpn_4_5: '作文と原稿用紙',
};

function subjectOf(id: string): Subject | null {
  if (/^math[_-]/.test(id)) return 'sansu';
  if (/^(jpn|kanji)[_-]/.test(id)) return 'kokugo';
  if (/^(science|sci)[_-]/.test(id) || /^cur-15/.test(id)) return 'rika';
  if (/^(social|soc)[_-]/.test(id) || /^cur-14/.test(id)) return 'shakai';
  if (/^seikatsu[_-]/.test(id) || /^cur-18/.test(id)) return 'seikatsu';
  if (/^(english|eng)[_-]/.test(id)) return 'eigo';
  return null;
}

function slug(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractLegacyRoadmap(source: string, sourceFile: string): LegacyRoadmapRow[] {
  const rows: LegacyRoadmapRow[] = [];
  const pattern =
    /\{\s*id:\s*["']([^"']+)["'][\s\S]{0,180}?grade:\s*([1-6])[\s\S]{0,180}?step:\s*(\d+)[\s\S]{0,180}?title:\s*["']([^"']+)["']/g;
  for (const match of source.matchAll(pattern)) {
    const subject = subjectOf(match[1]!);
    if (!subject) continue;
    rows.push({
      legacyNode: match[1]!,
      grade: Number(match[2]) as Grade,
      order: Number(match[3]),
      title: match[4]!.trim(),
      subject,
      sourceFile,
    });
  }
  return rows;
}

export function roadmapUnits(rows: LegacyRoadmapRow[]): Unit[] {
  const seenLegacy = new Set<string>();
  const seenIds = new Set<string>();
  const units: Unit[] = [];
  for (const row of rows) {
    if (seenLegacy.has(row.legacyNode)) continue;
    seenLegacy.add(row.legacyNode);
    const id = `${row.subject}.g${row.grade}.legacy-${slug(row.legacyNode)}`;
    if (seenIds.has(id)) throw new Error(`単元IDが衝突しました: ${id}`);
    seenIds.add(id);
    units.push(
      unitSchema.parse({
        id,
        name: row.title,
        subject: row.subject,
        grade: row.grade,
        order: row.order,
        legacyNode: row.legacyNode,
      }),
    );
  }
  return units.sort((a, b) => a.subject.localeCompare(b.subject) || a.grade - b.grade || a.order! - b.order!);
}

async function main(): Promise<void> {
  const sourceIndex = process.argv.indexOf('--source');
  const sourceArg = sourceIndex >= 0 ? process.argv[sourceIndex + 1] : undefined;
  if (!sourceArg) throw new Error('--source /path/to/autonomy-game を指定してください');
  const lib = resolve(sourceArg, 'src/lib');
  const rows = (
    await Promise.all(
      FILES.map(async (file) =>
        extractLegacyRoadmap(await readFile(join(lib, file), 'utf8'), basename(file)),
      ),
    )
  ).flat();
  const units = roadmapUnits(rows);
  const knownNodes = new Set(units.map((unit) => unit.legacyNode));
  try {
    const staged = JSON.parse(
      await readFile(resolve('imports/legacy-questions/staged.json'), 'utf8'),
    ) as Array<{ subject: Subject; grade: Grade; legacy: { nodeId: string } }>;
    for (const question of staged) {
      if (knownNodes.has(question.legacy.nodeId)) continue;
      knownNodes.add(question.legacy.nodeId);
      units.push(
        unitSchema.parse({
          id: `${question.subject}.g${question.grade}.legacy-${slug(question.legacy.nodeId)}`,
          name:
            FALLBACK_TITLES[question.legacy.nodeId] ?? `${question.grade}年 単元 ${question.legacy.nodeId}`,
          subject: question.subject,
          grade: question.grade,
          order: 1000 + units.length,
          legacyNode: question.legacy.nodeId,
        }),
      );
    }
  } catch {
    /* 問題ステージング前でもロードマップ単体で実行できる */
  }
  await mkdir(resolve('imports/legacy-roadmap'), { recursive: true });
  await writeFile(
    resolve('imports/legacy-roadmap/staged.json'),
    `${JSON.stringify({ source: resolve(sourceArg), units }, null, 2)}\n`,
  );
  console.log(`legacy roadmap: ${units.length} units staged`);

  if (process.argv.includes('--promote')) {
    const target = resolve('content/units.json');
    const current = JSON.parse(await readFile(target, 'utf8')) as Unit[];
    const ids = new Set(current.map((unit) => unit.id));
    const merged = [...current, ...units.filter((unit) => !ids.has(unit.id))];
    await writeFile(target, `${JSON.stringify(merged, null, 2)}\n`);
    console.log(`content/units.json: ${merged.length} units (${merged.length - current.length} added)`);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) await main();
