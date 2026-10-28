import type { RoadmapNode } from '../../shared/menuModel';
import type { CurriculumGraph } from './model';
import { canonicalUnitId } from './unitAliases';

type SupportingLink = NonNullable<RoadmapNode['supportingLinks']>[number];

export interface RoadmapRelationProjection {
  readonly prerequisiteIdsByTarget: ReadonlyMap<string, readonly string[]>;
  readonly supportingLinksByTarget: ReadonlyMap<string, readonly SupportingLink[]>;
}

const compareIds = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const supportingKindPriority: Readonly<Record<SupportingLink['kind'], number>> = {
  component: 0,
  transfer: 1,
  related: 2,
  chronological: 3,
};

function asSupportingKind(kind: string): SupportingLink['kind'] | undefined {
  return kind in supportingKindPriority ? (kind as SupportingLink['kind']) : undefined;
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
  for (const targetId of [...prerequisitesByTarget.keys()].sort(compareIds)) {
    prerequisiteIdsByTarget.set(targetId, [...prerequisitesByTarget.get(targetId)!].sort(compareIds));
  }

  const supportingByTarget = new Map<string, Map<string, SupportingLink['kind']>>();
  for (const relation of graph.relations) {
    const kind = asSupportingKind(relation.kind);
    if (!kind) continue;
    const sourceId = unitByConceptId.get(relation.from);
    const targetId = unitByConceptId.get(relation.to);
    if (!sourceId || !targetId || sourceId === targetId) continue;
    if (prerequisitesByTarget.get(targetId)?.has(sourceId)) continue;
    const linksBySource = supportingByTarget.get(targetId) ?? new Map();
    const currentKind = linksBySource.get(sourceId);
    if (currentKind === undefined || supportingKindPriority[kind] < supportingKindPriority[currentKind]) {
      linksBySource.set(sourceId, kind);
    }
    supportingByTarget.set(targetId, linksBySource);
  }

  const supportingLinksByTarget = new Map<string, readonly SupportingLink[]>();
  for (const targetId of [...supportingByTarget.keys()].sort(compareIds)) {
    const linksBySource = supportingByTarget.get(targetId)!;
    supportingLinksByTarget.set(
      targetId,
      [...linksBySource.keys()]
        .sort(compareIds)
        .map((sourceId) => ({ sourceId, kind: linksBySource.get(sourceId)! })),
    );
  }

  return {
    prerequisiteIdsByTarget,
    supportingLinksByTarget,
  };
}
