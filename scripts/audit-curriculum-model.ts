import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { unitSchema } from '../src/core/content/schemas';
import { curriculumGraphSchema } from '../src/core/learning/model';
import { buildCurriculumCoverage } from '../src/core/learning/coverage';

const root = resolve(import.meta.dirname, '..');
const option = (name: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const grade = Number(option('--grade') ?? 1) as 1 | 2 | 3 | 4 | 5 | 6;
const term = Number(option('--term') ?? 1) as 1 | 2 | 3;
const hasScopeOptions = process.argv.includes('--grade') || process.argv.includes('--term');
if (![1, 2, 3, 4, 5, 6].includes(grade)) throw new Error(`学年が不正です: ${grade}`);
if (![1, 2, 3].includes(term)) throw new Error(`学期が不正です: ${term}`);
const content = resolve(root, 'content');
const units = unitSchema.array().parse(JSON.parse(await readFile(resolve(content, 'units.json'), 'utf8')));
const manifest = JSON.parse(await readFile(resolve(content, 'manifest.json'), 'utf8')) as {
  questions: string[];
};
const questions = (
  await Promise.all(
    manifest.questions
      .filter((file) => !file.startsWith('questions/_samples/'))
      .map(
        async (file) =>
          JSON.parse(await readFile(resolve(content, file), 'utf8')) as { id: string; unit: string }[],
      ),
  )
).flat();
const graphFiles = (await readdir(resolve(content, 'curriculum'))).filter((file) => file.endsWith('.json'));
const graphs = await Promise.all(
  graphFiles.map(async (file) =>
    curriculumGraphSchema.parse(JSON.parse(await readFile(resolve(content, 'curriculum', file), 'utf8'))),
  ),
);
const concepts = graphs.flatMap((graph) => graph.concepts);
const linkedQuestionIds = new Set(
  graphs.flatMap((graph) => graph.questionLinks.map((link) => link.questionId)),
);
const questionConceptLinks = graphs.flatMap((graph) => graph.questionLinks);
const report = buildCurriculumCoverage({
  units,
  questions,
  concepts,
  linkedQuestionIds,
  questionConceptLinks,
  grade,
  term,
});

await mkdir(resolve(root, 'imports'), { recursive: true });
await writeFile(
  resolve(
    root,
    hasScopeOptions
      ? `imports/curriculum-model-audit-g${grade}-t${term}.json`
      : 'imports/curriculum-model-audit.json',
  ),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  `curriculum model g${grade} t${term}: ${report.units.length} units / ${report.units.reduce((n, unit) => n + unit.goals, 0)} goals / ${report.units.reduce((n, unit) => n + unit.questions, 0)} questions / ${report.gaps.length} gap(s)`,
);
if (process.argv.includes('--strict') && report.gaps.length > 0) {
  throw new Error(`カリキュラムモデル監査で ${report.gaps.length} 件の欠落が見つかりました`);
}
