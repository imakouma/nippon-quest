import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { unitSchema } from '../src/core/content/schemas';
import { curriculumGraphSchema } from '../src/core/learning/model';
import { buildCurriculumCoverage } from '../src/core/learning/coverage';

const root = resolve(import.meta.dirname, '..');
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
  grade: 1,
  term: 1,
});

await mkdir(resolve(root, 'imports'), { recursive: true });
await writeFile(resolve(root, 'imports/curriculum-model-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `curriculum model: ${report.units.length} units / ${report.units.reduce((n, unit) => n + unit.goals, 0)} goals / ${report.units.reduce((n, unit) => n + unit.questions, 0)} questions / ${report.gaps.length} gap(s)`,
);
if (process.argv.includes('--strict') && report.gaps.length > 0) {
  throw new Error(`カリキュラムモデル監査で ${report.gaps.length} 件の欠落が見つかりました`);
}
