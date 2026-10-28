import type { RoadmapNode } from '../../shared/menuModel';
import type { CurriculumGraph } from './model';
import { canonicalUnitId } from './unitAliases';

type SupportingLink = NonNullable<RoadmapNode['supportingLinks']>[number];

export interface RoadmapRelationProjection {
  readonly prerequisiteIdsByTarget: ReadonlyMap<string, readonly string[]>;
  readonly supportingLinksByTarget: ReadonlyMap<string, readonly SupportingLink[]>;
}

const compareIds = (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0);

const supportingKindPriority: Readonly<Record<SupportingLink['kind'], number>> = {
  component: 0,
  transfer: 1,
  related: 2,
  chronological: 3,
};

function asSupportingKind(kind: string): SupportingLink['kind'] | undefined {
  return kind in supportingKindPriority ? (kind as SupportingLink['kind']) : undefined;
}

function addEdge(targetsBySource: Map<string, Set<string>>, sourceId: string, targetId: string): void {
  const targetIds = targetsBySource.get(sourceId) ?? new Set<string>();
  targetIds.add(targetId);
  targetsBySource.set(sourceId, targetIds);
}

function hasPath(
  targetsBySource: ReadonlyMap<string, ReadonlySet<string>>,
  from: string,
  to: string,
): boolean {
  const pending = [from];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const unitId = pending.pop()!;
    if (unitId === to) return true;
    if (visited.has(unitId)) continue;
    visited.add(unitId);
    pending.push(...(targetsBySource.get(unitId) ?? []));
  }
  return false;
}

function findCycle(targetsBySource: ReadonlyMap<string, ReadonlySet<string>>): string[] | undefined {
  const visited = new Set<string>();
  const path: string[] = [];
  const visit = (unitId: string): string[] | undefined => {
    const cycleStart = path.indexOf(unitId);
    if (cycleStart >= 0) return [...path.slice(cycleStart), unitId];
    if (visited.has(unitId)) return undefined;
    path.push(unitId);
    for (const targetId of [...(targetsBySource.get(unitId) ?? [])].sort(compareIds)) {
      const cycle = visit(targetId);
      if (cycle) return cycle;
    }
    path.pop();
    visited.add(unitId);
    return undefined;
  };

  const unitIds = new Set<string>();
  for (const [sourceId, targetIds] of targetsBySource) {
    unitIds.add(sourceId);
    for (const targetId of targetIds) unitIds.add(targetId);
  }
  for (const unitId of [...unitIds].sort(compareIds)) {
    const cycle = visit(unitId);
    if (cycle) return cycle;
  }
  return undefined;
}

export function projectRoadmapRelations(
  graph: Pick<CurriculumGraph, 'concepts' | 'relations'>,
  displayUnitIds: ReadonlySet<string>,
): RoadmapRelationProjection {
  const unitByConceptId = new Map<string, string>();
  for (const concept of graph.concepts) {
    if (concept.kind === 'misconception') continue;
    const unitId = canonicalUnitId(concept.unit);
    if (displayUnitIds.has(unitId)) unitByConceptId.set(concept.id, unitId);
  }

  const prerequisitesByTarget = new Map<string, Set<string>>();
  for (const relation of graph.relations) {
    if (relation.kind !== 'prerequisite') continue;
    const sourceId = unitByConceptId.get(relation.from);
    const targetId = unitByConceptId.get(relation.to);
    if (!sourceId || !targetId || sourceId === targetId) continue;
    const sourceIds = prerequisitesByTarget.get(targetId) ?? new Set<string>();
    sourceIds.add(sourceId);
    prerequisitesByTarget.set(targetId, sourceIds);
  }

  const prerequisiteIdsByTarget = new Map<string, readonly string[]>();
  const targetsBySource = new Map<string, Set<string>>();
  for (const targetId of [...prerequisitesByTarget.keys()].sort(compareIds)) {
    const sourceIds = [...prerequisitesByTarget.get(targetId)!].sort(compareIds);
    prerequisiteIdsByTarget.set(targetId, sourceIds);
    for (const sourceId of sourceIds) addEdge(targetsBySource, sourceId, targetId);
  }
  const prerequisiteCycle = findCycle(targetsBySource);
  if (prerequisiteCycle) {
    throw new Error(`Projected prerequisite cycle: ${prerequisiteCycle.join(' -> ')}`);
  }

  const supportingByTarget = new Map<string, Map<string, SupportingLink['kind']>>();
  for (const relation of graph.relations) {
    const kind = asSupportingKind(relation.kind);
    if (!kind) continue;
    const sourceId = unitByConceptId.get(relation.from);
    const targetId = unitByConceptId.get(relation.to);
    if (!sourceId || !targetId || sourceId === targetId) continue;
    if (prerequisitesByTarget.get(targetId)?.has(sourceId)) continue;
    const linksBySource: Map<string, SupportingLink['kind']> = supportingByTarget.get(targetId) ?? new Map();
    const currentKind = linksBySource.get(sourceId);
    if (currentKind === undefined || supportingKindPriority[kind] < supportingKindPriority[currentKind]) {
      linksBySource.set(sourceId, kind);
    }
    supportingByTarget.set(targetId, linksBySource);
  }

  const candidates: (SupportingLink & { targetId: string })[] = [];
  for (const [targetId, linksBySource] of supportingByTarget) {
    for (const [sourceId, kind] of linksBySource) candidates.push({ sourceId, targetId, kind });
  }
  candidates.sort(
    (left, right) =>
      supportingKindPriority[left.kind] - supportingKindPriority[right.kind] ||
      compareIds(left.sourceId, right.sourceId) ||
      compareIds(left.targetId, right.targetId),
  );

  const retainedByTarget = new Map<string, SupportingLink[]>();
  for (const candidate of candidates) {
    if (hasPath(targetsBySource, candidate.targetId, candidate.sourceId)) continue;
    addEdge(targetsBySource, candidate.sourceId, candidate.targetId);
    const links = retainedByTarget.get(candidate.targetId) ?? [];
    links.push({ sourceId: candidate.sourceId, kind: candidate.kind });
    retainedByTarget.set(candidate.targetId, links);
  }

  const supportingLinksByTarget = new Map<string, readonly SupportingLink[]>();
  for (const targetId of [...retainedByTarget.keys()].sort(compareIds)) {
    supportingLinksByTarget.set(
      targetId,
      retainedByTarget.get(targetId)!.sort((left, right) => compareIds(left.sourceId, right.sourceId)),
    );
  }

  return {
    prerequisiteIdsByTarget,
    supportingLinksByTarget,
  };
}
