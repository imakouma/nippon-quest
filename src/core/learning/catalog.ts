import type { CurriculumGraph } from './model';
import { validateCurriculumGraph } from './graph';

const files = import.meta.glob('../../../content/curriculum/**/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const graphs = Object.entries(files).map(([file, raw]) => {
  const result = validateCurriculumGraph(raw);
  if (!result.graph) throw new Error(`${file} の学習知識グラフが不正です: ${result.errors.join(', ')}`);
  return result.graph;
});
if (!graphs.length) throw new Error('学習知識グラフが1件もありません');

/** curriculum/ に追加したグラフを自動的に統合する。ID衝突は起動時に止める。 */
export const curriculumGraph: CurriculumGraph = {
  schemaVersion: 1,
  sources: uniqueById(
    graphs.flatMap((graph) => graph.sources),
    '根拠資料',
  ),
  concepts: uniqueById(
    graphs.flatMap((graph) => graph.concepts),
    '概念',
  ),
  relations: graphs.flatMap((graph) => graph.relations),
  questionLinks: uniqueById(
    graphs.flatMap((graph) => graph.questionLinks.map((link) => ({ ...link, id: link.questionId }))),
    '問題リンク',
  ).map(({ id: _, ...link }) => link),
};

export const conceptsById = new Map(curriculumGraph.concepts.map((concept) => [concept.id, concept]));
export const questionLinksById = new Map(
  curriculumGraph.questionLinks.map((link) => [link.questionId, link]),
);

function uniqueById<T extends { id: string }>(items: T[], label: string): T[] {
  const found = new Map<string, T>();
  for (const item of items) {
    const previous = found.get(item.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(item))
      throw new Error(`${label}ID ${item.id} が複数ファイルで競合しています`);
    found.set(item.id, item);
  }
  return [...found.values()];
}
