import { curriculumGraphSchema, type CurriculumGraph } from './model';

export interface GraphValidationResult {
  graph: CurriculumGraph | null;
  errors: string[];
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
