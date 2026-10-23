import { curriculumGraphSchema, type CurriculumGraph } from './model';

export interface GraphValidationResult {
  graph: CurriculumGraph | null;
  errors: string[];
}

/** 個別ファイルは外部概念を参照できるため、ここでは構文だけを検証する。 */
export function parseCurriculumGraphFragment(raw: unknown): GraphValidationResult {
  const parsed = curriculumGraphSchema.safeParse(raw);
  if (!parsed.success)
    return {
      graph: null,
      errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    };
  return { graph: parsed.data, errors: [] };
}

/** 複数ファイルを一つの知識グラフへまとめ、参照と循環を全体で検証する。 */
export function mergeCurriculumGraphs(graphs: readonly CurriculumGraph[]): GraphValidationResult {
  const errors: string[] = [];
  const merged: CurriculumGraph = {
    schemaVersion: 1,
    sources: uniqueMerged(
      graphs.flatMap((graph) => graph.sources),
      '根拠資料',
      errors,
    ),
    concepts: uniqueMerged(
      graphs.flatMap((graph) => graph.concepts),
      '概念',
      errors,
    ),
    relations: graphs.flatMap((graph) => graph.relations),
    questionLinks: uniqueMerged(
      graphs.flatMap((graph) => graph.questionLinks),
      '問題リンク',
      errors,
      (link) => link.questionId,
    ),
  };
  const checked = validateCurriculumGraph(merged);
  errors.push(...checked.errors);
  return { graph: errors.length ? null : checked.graph, errors };
}

export function validateCurriculumGraph(raw: unknown): GraphValidationResult {
  const parsed = curriculumGraphSchema.safeParse(raw);
  if (!parsed.success)
    return {
      graph: null,
      errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    };

  const graph = parsed.data;
  const errors: string[] = [];
  const sourceIds = uniqueIds(graph.sources, 'source', errors);
  const conceptIds = uniqueIds(graph.concepts, 'concept', errors);
  const questionIds = new Set<string>();

  for (const concept of graph.concepts)
    for (const sourceId of concept.sourceIds)
      if (!sourceIds.has(sourceId)) errors.push(`concept ${concept.id}: source ${sourceId} が存在しません`);

  for (const relation of graph.relations) {
    if (!conceptIds.has(relation.from)) errors.push(`relation: from ${relation.from} が存在しません`);
    if (!conceptIds.has(relation.to)) errors.push(`relation: to ${relation.to} が存在しません`);
    if (relation.from === relation.to) errors.push(`relation: ${relation.from} の自己参照です`);
    for (const sourceId of relation.sourceIds)
      if (!sourceIds.has(sourceId))
        errors.push(`relation ${relation.from} -> ${relation.to}: source ${sourceId} が存在しません`);
  }

  for (const link of graph.questionLinks) {
    if (questionIds.has(link.questionId)) errors.push(`questionLink ${link.questionId}: 重複しています`);
    questionIds.add(link.questionId);
    const total = link.concepts.reduce((sum, concept) => sum + concept.weight, 0);
    if (Math.abs(total - 1) > 0.001)
      errors.push(`questionLink ${link.questionId}: weight 合計が1ではありません`);
    for (const concept of link.concepts)
      if (!conceptIds.has(concept.conceptId))
        errors.push(`questionLink ${link.questionId}: concept ${concept.conceptId} が存在しません`);
    for (const signal of link.misconceptionSignals)
      if (!conceptIds.has(signal.conceptId))
        errors.push(`questionLink ${link.questionId}: misconception ${signal.conceptId} が存在しません`);
  }

  errors.push(...prerequisiteCycles(graph));
  return { graph: errors.length ? null : graph, errors };
}

function uniqueIds(items: readonly { id: string }[], label: string, errors: string[]): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) errors.push(`${label} ${item.id}: 重複しています`);
    ids.add(item.id);
  }
  return ids;
}

function uniqueMerged<T extends { id: string }>(items: readonly T[], label: string, errors: string[]): T[];
function uniqueMerged<T>(
  items: readonly T[],
  label: string,
  errors: string[],
  idOf: (item: T) => string,
): T[];
function uniqueMerged<T>(
  items: readonly T[],
  label: string,
  errors: string[],
  idOf: (item: T) => string = (item) => (item as { id: string }).id,
): T[] {
  const found = new Map<string, T>();
  for (const item of items) {
    const id = idOf(item);
    const previous = found.get(id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(item))
      errors.push(`${label}ID ${id} が複数ファイルで競合しています`);
    else if (!previous) found.set(id, item);
  }
  return [...found.values()];
}

function prerequisiteCycles(graph: CurriculumGraph): string[] {
  const next = new Map<string, string[]>();
  for (const relation of graph.relations) {
    if (relation.kind !== 'prerequisite') continue;
    const list = next.get(relation.from) ?? [];
    list.push(relation.to);
    next.set(relation.from, list);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const errors: string[] = [];
  const walk = (id: string, path: string[]) => {
    if (visiting.has(id)) {
      errors.push(`prerequisite cycle: ${[...path, id].join(' -> ')}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const target of next.get(id) ?? []) walk(target, [...path, id]);
    visiting.delete(id);
    visited.add(id);
  };
  for (const concept of graph.concepts) walk(concept.id, []);
  return errors;
}
