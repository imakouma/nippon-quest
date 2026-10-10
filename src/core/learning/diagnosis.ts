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
    add(
      mapped.conceptId,
      mapped.weight * uncertainty,
      'この 問題[もんだい]が 直接[ちょくせつ] 使[つか]う 知識[ちしき]です',
    );
    add(mapped.conceptId, mapped.weight * uncertainty, evidenceReason(state, now));
    for (const relation of graph.relations)
      if (relation.kind === 'prerequisite' && relation.to === mapped.conceptId) {
        const prereq = states[relation.from];
        const weakness = prereq ? 1 - prereq.understanding * prereq.confidence : 0.8;
        add(
          relation.from,
          mapped.weight * relation.strength * weakness,
          '前提知識[ぜんていちしき]の 確認[かくにん]が 必要[ひつよう]です',
        );
        add(relation.from, mapped.weight * relation.strength * weakness, evidenceReason(prereq, now));
      }
  }

  if (selectedAnswerId)
    for (const signal of link.misconceptionSignals)
      if (signal.answerId === selectedAnswerId)
        add(
          signal.conceptId,
          signal.confidence,
          `選[えら]んだ答[こた]え「${selectedAnswerId}」に 対応[たいおう]する 誤[あやま]り方[かた]です`,
        );

  return [...candidates.values()]
    .map((candidate) => ({ ...candidate, confidence: Math.min(0.95, candidate.confidence) }))
    .sort((a, b) => b.confidence - a.confidence || a.conceptId.localeCompare(b.conceptId));
}

function evidenceReason(state: ConceptState | undefined, now: number): string {
  if (!state || state.attempts === 0)
    return 'この 知識[ちしき]の 回答履歴[かいとうりれき]が なく、未確認[みかくにん]です';
  const retention = estimatedRetention(state, now);
  if (state.understanding >= 0.5 && retention < state.understanding * 0.55)
    return '以前[いぜん]の 理解推定[りかいすいてい]に 比[くら]べて 定着推定[ていちゃくすいてい]が 下[さ]がり、忘[わす]れている 可能性[かのうせい]が あります';
  if (state.confidence < 0.55)
    return '回答数[かいとうすう]が 少[すく]なく、原因[げんいん]を 絞[しぼ]る 証拠[しょうこ]が 不足[ふそく]しています';
  if (state.understanding < 0.5)
    return '複数回[ふくすうかい]の 履歴[りれき]でも 理解推定[りかいすいてい]が 低[ひく]く、学[まな]び直[なお]しが 必要[ひつよう]な 可能性[かのうせい]が あります';
  return '現在[げんざい]の 履歴[りれき]だけでは 理解不足[りかいぶそく]と 一時的[いちじてき]な ミスを 区別[くべつ]できません';
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
