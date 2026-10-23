import type { Unit } from '../content/schemas';
import type { CurriculumGraph } from './model';
import { isRequiredCourse } from './placement';
import { canonicalUnitId } from './unitAliases';

export interface CurriculumUnitEdge {
  from: string;
  to: string;
  fromConcept: string;
  toConcept: string;
}

export interface SubjectGraphQuality {
  units: number;
  edges: number;
  branches: number;
  merges: number;
  isolated: string[];
  roots: string[];
}

/** 前提関係を単元へ集約し、ロードマップとしての構造品質を測る。 */
export function buildCurriculumGraphQuality(input: { units: readonly Unit[]; graph: CurriculumGraph }) {
  const allUnitIds = new Set(input.units.map((unit) => unit.id));
  const requiredUnits = new Map<string, Unit>();
  for (const unit of input.units) {
    if (!unit.courseKind || !isRequiredCourse({ ...unit, courseKind: unit.courseKind })) continue;
    const canonical = canonicalUnitId(unit.id);
    if (canonical !== unit.id && allUnitIds.has(canonical)) continue;
    requiredUnits.set(canonical, canonical === unit.id ? unit : { ...unit, id: canonical });
  }

  const conceptUnits = new Map<string, Unit>();
  for (const concept of input.graph.concepts) {
    const unit = requiredUnits.get(canonicalUnitId(concept.unit));
    if (unit && concept.kind !== 'misconception') conceptUnits.set(concept.id, unit);
  }

  const duplicateRelations: string[] = [];
  const relationKeys = new Set<string>();
  const crossSubjectEdges: CurriculumUnitEdge[] = [];
  const reverseGradeEdges: CurriculumUnitEdge[] = [];
  const unitEdges = new Map<string, CurriculumUnitEdge>();
  let unreviewedPrerequisites = 0;

  for (const relation of input.graph.relations) {
    const relationKey = `${relation.kind}:${relation.from}->${relation.to}`;
    if (relationKeys.has(relationKey)) duplicateRelations.push(relationKey);
    relationKeys.add(relationKey);
    if (relation.kind !== 'prerequisite') continue;
    if (relation.reviewStatus === 'draft') unreviewedPrerequisites++;
    const from = conceptUnits.get(relation.from);
    const to = conceptUnits.get(relation.to);
    if (!from || !to || from.id === to.id) continue;
    const edge = {
      from: from.id,
      to: to.id,
      fromConcept: relation.from,
      toConcept: relation.to,
    };
    if (from.subject !== to.subject) crossSubjectEdges.push(edge);
    if (from.grade > to.grade) reverseGradeEdges.push(edge);
    unitEdges.set(`${from.id}->${to.id}`, edge);
  }

  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();
  for (const edge of unitEdges.values()) {
    const next = outgoing.get(edge.from) ?? new Set<string>();
    next.add(edge.to);
    outgoing.set(edge.from, next);
    const previous = incoming.get(edge.to) ?? new Set<string>();
    previous.add(edge.from);
    incoming.set(edge.to, previous);
  }

  const bySubject: Record<string, SubjectGraphQuality> = {};
  for (const subject of new Set([...requiredUnits.values()].map((unit) => unit.subject))) {
    const subjectUnits = [...requiredUnits.values()].filter((unit) => unit.subject === subject);
    const subjectIds = new Set(subjectUnits.map((unit) => unit.id));
    bySubject[subject] = {
      units: subjectUnits.length,
      edges: [...unitEdges.values()].filter((edge) => subjectIds.has(edge.from) && subjectIds.has(edge.to))
        .length,
      branches: subjectUnits.filter((unit) => (outgoing.get(unit.id)?.size ?? 0) > 1).length,
      merges: subjectUnits.filter((unit) => (incoming.get(unit.id)?.size ?? 0) > 1).length,
      isolated: subjectUnits
        .filter(
          (unit) => (incoming.get(unit.id)?.size ?? 0) === 0 && (outgoing.get(unit.id)?.size ?? 0) === 0,
        )
        .map((unit) => unit.id)
        .sort(),
      roots: subjectUnits
        .filter((unit) => (incoming.get(unit.id)?.size ?? 0) === 0 && (outgoing.get(unit.id)?.size ?? 0) > 0)
        .map((unit) => unit.id)
        .sort(),
    };
  }

  return {
    bySubject,
    edges: [...unitEdges.values()],
    duplicateRelations,
    crossSubjectEdges,
    reverseGradeEdges,
    unitCycles: findCycles(requiredUnits.keys(), outgoing),
    unreviewedPrerequisites,
  };
}

function findCycles(nodes: Iterable<string>, outgoing: ReadonlyMap<string, ReadonlySet<string>>): string[][] {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycles: string[][] = [];
  const walk = (id: string, path: string[]) => {
    const cycleAt = path.indexOf(id);
    if (cycleAt >= 0) {
      cycles.push([...path.slice(cycleAt), id]);
      return;
    }
    if (visiting.has(id) || visited.has(id)) return;
    visiting.add(id);
    for (const target of outgoing.get(id) ?? []) walk(target, [...path, id]);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of nodes) walk(id, []);
  return cycles;
}
