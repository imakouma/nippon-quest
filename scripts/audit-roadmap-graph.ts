import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { unitSchema } from '../src/core/content/schemas';
import { mergeCurriculumGraphs, parseCurriculumGraphFragment } from '../src/core/learning/graph';
import { buildCurriculumGraphQuality } from '../src/core/learning/graphQuality';
import type { CurriculumGraph } from '../src/core/learning/model';

const root = resolve(import.meta.dirname, '..');

function jsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name);
    if (statSync(path).isDirectory()) return jsonFiles(path);
    return name.endsWith('.json') ? [path] : [];
  });
}

const fragments: CurriculumGraph[] = [];
const parseErrors: string[] = [];
for (const file of jsonFiles(resolve(root, 'content/curriculum'))) {
  const parsed = parseCurriculumGraphFragment(JSON.parse(readFileSync(file, 'utf8')) as unknown);
  if (!parsed.graph) parseErrors.push(...parsed.errors.map((error) => `${file}: ${error}`));
  else fragments.push(parsed.graph);
}
if (parseErrors.length) throw new Error(parseErrors.join('\n'));

const merged = mergeCurriculumGraphs(fragments);
if (!merged.graph) throw new Error(merged.errors.join('\n'));
const units = unitSchema
  .array()
  .parse(JSON.parse(readFileSync(resolve(root, 'content/units.json'), 'utf8')) as unknown);
const report = buildCurriculumGraphQuality({ units, graph: merged.graph });

for (const [subject, quality] of Object.entries(report.bySubject))
  console.log(
    `${subject}: ${quality.units} units / ${quality.edges} visible edges (${quality.hardEdges} hard) / ${quality.branches} branches / ${quality.merges} merges (${quality.hardMerges} hard) / ${quality.isolated.length} isolated / ${quality.roots.length} roots`,
  );
console.log(
  `global: ${report.duplicateRelations.length} duplicate relations / ${report.overlappingUnitEdges.length} overlapping hard+soft unit edges / ${report.crossSubjectDisplayEdges.length} cross-subject display edges (${report.crossSubjectEdges.length} hard) / ${report.reverseGradeEdges.length} reverse-grade hard edges / ${report.unitCycles.length} display cycles / ${report.prerequisiteCycles.length} hard cycles / ${report.unreviewedDisplayRelations.length} draft display relations / ${report.displayRelationsWithoutSources.length} display relations without sources / relation reviews ${report.relationReviews.draft} draft, ${report.relationReviews.sourceChecked} source-checked, ${report.relationReviews.expertReviewed} expert-reviewed`,
);

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));

if (process.argv.includes('--strict')) {
  const failures: string[] = [];
  for (const [subject, quality] of Object.entries(report.bySubject)) {
    if (quality.isolated.length)
      failures.push(`${subject}: 孤立単元 ${quality.isolated.length}件 (${quality.isolated.join(', ')})`);
    if (quality.branches === 0) failures.push(`${subject}: 分岐がありません`);
    if (quality.merges === 0) failures.push(`${subject}: 合流がありません`);
  }
  if (report.duplicateRelations.length) failures.push(`重複関係 ${report.duplicateRelations.length}件`);
  if (report.overlappingUnitEdges.length)
    failures.push(`必須線と補助線が重なる単元ペア ${report.overlappingUnitEdges.length}件`);
  if (report.crossSubjectEdges.length)
    failures.push(`教科横断ハードロック ${report.crossSubjectEdges.length}件`);
  if (report.crossSubjectDisplayEdges.length)
    failures.push(`単一教科画面では見えない教科横断表示線 ${report.crossSubjectDisplayEdges.length}件`);
  if (report.reverseGradeEdges.length) failures.push(`逆学年線 ${report.reverseGradeEdges.length}件`);
  if (report.unitCycles.length) failures.push(`表示単元循環 ${report.unitCycles.length}件`);
  if (report.prerequisiteCycles.length)
    failures.push(`ハードロック単元循環 ${report.prerequisiteCycles.length}件`);
  if (report.unreviewedPrerequisites)
    failures.push(`未確認のハードロック ${report.unreviewedPrerequisites}件`);
  if (report.unreviewedDisplayRelations.length)
    failures.push(`未確認の表示関係 ${report.unreviewedDisplayRelations.length}件`);
  if (report.displayRelationsWithoutSources.length)
    failures.push(`出典のない表示関係 ${report.displayRelationsWithoutSources.length}件`);
  if (failures.length) throw new Error(`ロードマップグラフ監査に失敗しました:\n${failures.join('\n')}`);
}
