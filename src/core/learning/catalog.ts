import type { CurriculumGraph } from './model';
import { mergeCurriculumGraphs, parseCurriculumGraphFragment } from './graph';

const files = import.meta.glob('../../../content/curriculum/**/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const graphs = Object.entries(files).map(([file, raw]) => {
  const result = parseCurriculumGraphFragment(raw);
  if (!result.graph) throw new Error(`${file} の学習知識グラフが不正です: ${result.errors.join(', ')}`);
  return result.graph;
});
if (!graphs.length) throw new Error('学習知識グラフが1件もありません');

const merged = mergeCurriculumGraphs(graphs);
if (!merged.graph) throw new Error(`統合した学習知識グラフが不正です: ${merged.errors.join(', ')}`);

/** curriculum/ に追加した断片を自動統合し、ファイルをまたぐ関係も全体で検証する。 */
export const curriculumGraph: CurriculumGraph = merged.graph;

export const conceptsById = new Map(curriculumGraph.concepts.map((concept) => [concept.id, concept]));
export const questionLinksById = new Map(
  curriculumGraph.questionLinks.map((link) => [link.questionId, link]),
);
