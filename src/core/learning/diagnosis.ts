import type { CurriculumGraph, QuestionConceptLink } from './model';
import { estimatedRetention, type ConceptState, type ConceptStateData } from './state';

export interface DiagnosisCandidate {
  conceptId: string;
  confidence: number;
  reasons: string[];
}

/** 断定はせず、履歴・問題の重み・前提関係から次に確かめる候補を返す。 */
export function diagnosisCandidates(
  graph: CurriculumGraph,
  link: QuestionConceptLink,
  states: ConceptStateData,
  selectedAnswerId?: string,
  now = Date.now(),
): DiagnosisCandidate[] {
  const byId = new Map(graph.concepts.map((concept) => [concept.id, concept]));
  const candidates = new Map<string, DiagnosisCandidate>();
  const add = (conceptId: string, confidence: number, reason: string) => {
    if (!byId.has(conceptId)) return;
    const prev = candidates.get(conceptId);
    if (prev) {
      prev.confidence = Math.max(prev.confidence, confidence);
      if (!prev.reasons.includes(reason)) prev.reasons.push(reason);
    } else candidates.set(conceptId, { conceptId, confidence, reasons: [reason] });
  };

  for (const mapped of link.concepts) {
    const state = states[mapped.conceptId];
    const uncertainty = state ? 1 - state.understanding * state.confidence : 0.75;
    add(mapped.conceptId, mapped.weight * uncertainty, 'この問題が直接使う知識です');
    add(mapped.conceptId, mapped.weight * uncertainty, evidenceReason(state, now));
    for (const relation of graph.relations)
      if (relation.kind === 'prerequisite' && relation.to === mapped.conceptId) {
        const prereq = states[relation.from];
        const weakness = prereq ? 1 - prereq.understanding * prereq.confidence : 0.8;
        add(relation.from, mapped.weight * relation.strength * weakness, '前提知識の確認が必要です');
        add(relation.from, mapped.weight * relation.strength * weakness, evidenceReason(prereq, now));
      }
  }

  if (selectedAnswerId)
    for (const signal of link.misconceptionSignals)
      if (signal.answerId === selectedAnswerId)
        add(signal.conceptId, signal.confidence, `選んだ答え「${selectedAnswerId}」に対応する誤り方です`);

  return [...candidates.values()]
    .map((candidate) => ({ ...candidate, confidence: Math.min(0.95, candidate.confidence) }))
    .sort((a, b) => b.confidence - a.confidence || a.conceptId.localeCompare(b.conceptId));
}

function evidenceReason(state: ConceptState | undefined, now: number): string {
  if (!state || state.attempts === 0) return 'この知識の回答履歴がなく、未確認です';
  const retention = estimatedRetention(state, now);
  if (state.understanding >= 0.5 && retention < state.understanding * 0.55)
    return '以前の理解推定に比べて定着推定が下がり、忘れている可能性があります';
  if (state.confidence < 0.55) return '回答数が少なく、原因を絞る証拠が不足しています';
  if (state.understanding < 0.5) return '複数回の履歴でも理解推定が低く、学び直しが必要な可能性があります';
  return '現在の履歴だけでは理解不足と一時的なミスを区別できません';
}

export function pickDiagnosticQuestion(
  links: readonly QuestionConceptLink[],
  candidates: readonly DiagnosisCandidate[],
  excludeQuestionIds: readonly string[] = [],
): QuestionConceptLink | null {
  const excluded = new Set(excludeQuestionIds);
  const priority = new Map(candidates.map((candidate) => [candidate.conceptId, candidate.confidence]));
  return (
    links
      .filter((link) => !excluded.has(link.questionId) && link.diagnosticValue > 0)
      .map((link) => ({
        link,
        score:
          link.diagnosticValue *
          link.concepts.reduce(
            (sum, concept) => sum + (priority.get(concept.conceptId) ?? 0) * concept.weight,
            0,
          ),
      }))
      .sort((a, b) => b.score - a.score || a.link.questionId.localeCompare(b.link.questionId))[0]?.link ??
    null
  );
}
