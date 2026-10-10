import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  conceptsById,
  curriculumGraph,
  diagnosisCandidates,
  estimatedRetention,
  questionLinksById,
} from '../../core/learning';
import type { GameState } from '../../core/state/schema';
import { exportGameJson, importGameJson } from '../../core/state/serialization';
import type { RoadmapNode } from '../../shared/menuModel';
import { RubyLabel } from '../RubyLabel';
import { t } from '../i18n';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { useModalFocus } from '../useModalFocus';

export interface ParentOverlayProps {
  game: GameState;
  getGame: () => GameState;
  mastery: RoadmapNode[];
  onChange: (game: GameState) => void;
  onImport: (game: GameState) => void;
  onClose: () => void;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;
const DAY = 86_400_000;

export function ParentOverlay({ game, getGame, mastery, onChange, onImport, onClose }: ParentOverlayProps) {
  if (typeof getGame !== 'function') throw new TypeError('ParentOverlay requires getGame');
  const dialogRef = useRef<HTMLElement>(null);
  const [unlocked, setUnlocked] = useState(false);
  useModalFocus(dialogRef, unlocked ? 'select' : 'input');
  const [answer, setAnswer] = useState('');
  const [gateError, setGateError] = useState(false);
  const [json, setJson] = useState('');
  const [message, setMessage] = useState('');
  const rows = useMemo(() => mastery.filter((row) => row.attempts > 0), [mastery]);
  const conceptRows = useMemo(
    () =>
      Object.entries(game.learning.conceptStates)
        .map(([id, state]) => ({ concept: conceptsById.get(id), state }))
        .filter((row) => row.concept)
        .sort((a, b) => a.state.dueAt - b.state.dueAt),
    [game.learning.conceptStates],
  );
  const latestDiagnosis = useMemo(() => {
    const failed = [...game.learning.attempts].reverse().find((attempt) => attempt.score < 0.8);
    if (!failed) return null;
    const link = questionLinksById.get(failed.questionId);
    if (!link) return null;
    return {
      questionId: failed.questionId,
      candidates: diagnosisCandidates(
        curriculumGraph,
        link,
        game.learning.conceptStates,
        failed.finalAnswer,
      ).slice(0, 3),
    };
  }, [game.learning.attempts, game.learning.conceptStates]);
  const dueText = (dueAt: number) => {
    const days = Math.ceil((dueAt - Date.now()) / DAY);
    if (days <= 0) return t('parent.reviewNow');
    if (days === 1) return t('parent.reviewTomorrow');
    return t('parent.reviewInDays', { n: days });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const patchLearning = (learning: Partial<GameState['learning']>) => {
    const current = getGame();
    onChange({ ...current, updatedAt: Date.now(), learning: { ...current.learning, ...learning } });
  };
  const patchSettings = (settings: Partial<GameState['settings']>) => {
    const current = getGame();
    onChange({ ...current, updatedAt: Date.now(), settings: { ...current.settings, ...settings } });
  };
  const unlock = () => {
    if (answer.trim() === '12') {
      playSfx('select');
      setUnlocked(true);
      setGateError(false);
    } else {
      playSfx('miss');
      setGateError(true);
    }
  };
  const doImport = () => {
    try {
      onImport(importGameJson(json));
      setMessage(t('parent.importDone'));
      playSfx('select');
    } catch {
      setMessage(t('parent.importError'));
      playSfx('miss');
    }
  };

  return (
    <div class="nq-wmap" onClick={onClose}>
      <section
        ref={dialogRef}
        class="nq-win nq-parent-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nq-parent-title"
        tabIndex={-1}
        onClick={(ev) => ev.stopPropagation()}
      >
        <header class="nq-menu-head">
          <h2 id="nq-parent-title" class="nq-menu-title">
            ⚙ {t('parent.title')}
          </h2>
          <button type="button" class="nq-back nq-menu-close" aria-keyshortcuts="Escape" onClick={onClose}>
            × {t('ui.close')}
          </button>
        </header>
        {!unlocked ? (
          <form class="nq-parent-gate" onSubmit={(ev) => (ev.preventDefault(), unlock())}>
            <p>
              <RubyLabel text={t('parent.gateHelp')} />
            </p>
            <label>
              <strong>7 + 5 = ?</strong>
              <input
                aria-label={displayText(t('parent.answer'))}
                inputMode="numeric"
                value={answer}
                onInput={(ev) => setAnswer(ev.currentTarget.value)}
                autofocus
              />
            </label>
            <button type="submit" class="nq-opt nq-parent-primary" aria-keyshortcuts="Enter">
              <RubyLabel text={t('parent.open')} />
            </button>
            {gateError && (
              <p class="nq-parent-error" role="alert">
                <RubyLabel text={t('parent.gateError')} />
              </p>
            )}
          </form>
        ) : (
          <div class="nq-parent-content">
            <section class="nq-parent-card">
              <h3>
                <RubyLabel text={t('parent.learning')} />
              </h3>
              <div class="nq-parent-grid">
                <label>
                  <RubyLabel text={t('parent.grade')} />
                  <select
                    value={game.learning.grade}
                    onChange={(ev) =>
                      patchLearning({
                        grade: Number(ev.currentTarget.value) as GameState['learning']['grade'],
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option value={n}>
                        {n}
                        {displayText(t('parent.gradeSuffix'))}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <RubyLabel text={t('parent.kanji')} />
                  <select
                    value={game.learning.kanjiLevel}
                    onChange={(ev) =>
                      patchLearning({
                        kanjiLevel: Number(ev.currentTarget.value) as GameState['learning']['grade'],
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option value={n}>
                        {n}
                        {displayText(t('parent.gradeSuffix'))}
                      </option>
                    ))}
                  </select>
                </label>
                <label class="nq-parent-check">
                  <input
                    type="checkbox"
                    checked={game.learning.includeLower}
                    onChange={(ev) => patchLearning({ includeLower: ev.currentTarget.checked })}
                  />{' '}
                  <RubyLabel text={t('parent.includeLower')} />
                </label>
                <label class="nq-parent-check">
                  <input
                    type="checkbox"
                    checked={game.learning.challengeHigher}
                    onChange={(ev) => patchLearning({ challengeHigher: ev.currentTarget.checked })}
                  />{' '}
                  <RubyLabel text={t('parent.challengeHigher')} />
                </label>
              </div>
            </section>
            <section class="nq-parent-card">
              <h3>
                <RubyLabel text={t('parent.settings')} />
              </h3>
              <div class="nq-parent-sliders">
                <label>
                  {t('parent.bgm')}{' '}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={game.settings.bgmVolume}
                    onInput={(ev) => patchSettings({ bgmVolume: Number(ev.currentTarget.value) })}
                  />{' '}
                  {percent(game.settings.bgmVolume)}
                </label>
                <label>
                  <RubyLabel text={t('parent.se')} />{' '}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={game.settings.seVolume}
                    onInput={(ev) => patchSettings({ seVolume: Number(ev.currentTarget.value) })}
                  />{' '}
                  {percent(game.settings.seVolume)}
                </label>
                <label>
                  <RubyLabel text={t('parent.timeLimit')} />
                  <select
                    value={game.settings.timeLimitScale}
                    onChange={(ev) => patchSettings({ timeLimitScale: Number(ev.currentTarget.value) })}
                  >
                    <option value="0.75">{displayText(t('parent.short'))}</option>
                    <option value="1">{t('parent.normal')}</option>
                    <option value="1.5">{displayText(t('parent.long'))}</option>
                    <option value="2">{displayText(t('parent.veryLong'))}</option>
                  </select>
                </label>
              </div>
            </section>
            <section class="nq-parent-card nq-parent-scroll">
              <h3>
                <RubyLabel text={t('parent.playTime')} />
              </h3>
              {Object.entries(game.learning.playSecondsByDate)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 7)
                .map(([date, seconds]) => (
                  <p class="nq-parent-time">
                    <time>{date}</time>
                    <strong>
                      {Math.floor(seconds / 60)}
                      <RubyLabel text={t('parent.minutes')} />
                    </strong>
                  </p>
                ))}
              {!Object.keys(game.learning.playSecondsByDate).length && (
                <p>
                  <RubyLabel text={t('parent.noRecord')} />
                </p>
              )}
              <h3>
                <RubyLabel text={t('parent.mastery')} />
              </h3>
              {rows.map((row) => (
                <div
                  class="nq-parent-mastery"
                  role="meter"
                  aria-label={displayText(row.name)}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(row.mastery * 100)}
                  aria-valuemax={100}
                  aria-valuetext={percent(row.mastery)}
                  title={`${displayText(row.name)} ${percent(row.mastery)}`}
                >
                  <span>
                    <RubyLabel text={row.name} />
                  </span>
                  <i>
                    <b style={{ width: percent(row.mastery) }} />
                  </i>
                  <strong>{percent(row.mastery)}</strong>
                </div>
              ))}
              {!rows.length && (
                <p>
                  <RubyLabel text={t('parent.noMastery')} />
                </p>
              )}
              <h3>
                <RubyLabel text={t('parent.concepts')} />
              </h3>
              {conceptRows.map(({ concept, state }) => (
                <div class="nq-parent-concept">
                  <strong>{concept?.name && <RubyLabel text={concept.name} />}</strong>
                  {concept?.description && (
                    <small class="nq-parent-concept-description">
                      <RubyLabel text={concept.description} />
                    </small>
                  )}
                  <span>
                    <RubyLabel text={t('parent.understanding')} /> {percent(state.understanding)}
                  </span>
                  <span>
                    <RubyLabel text={t('parent.retention')} />{' '}
                    {percent(estimatedRetention(state, Date.now()))}
                  </span>
                  <small>
                    <RubyLabel text={dueText(state.dueAt)} />・
                    <RubyLabel text={t('parent.attemptCount', { n: state.attempts })} />
                  </small>
                </div>
              ))}
              {!conceptRows.length && (
                <p>
                  <RubyLabel text={t('parent.noConcepts')} />
                </p>
              )}
              <h3>
                <RubyLabel text={t('parent.diagnosis')} />
              </h3>
              {latestDiagnosis ? (
                <div class="nq-parent-diagnosis">
                  <small>
                    <RubyLabel text={t('parent.diagnosisQuestion', { id: latestDiagnosis.questionId })} />
                  </small>
                  {latestDiagnosis.candidates.map((candidate) => (
                    <p>
                      <strong>
                        <RubyLabel
                          text={conceptsById.get(candidate.conceptId)?.name ?? candidate.conceptId}
                        />
                      </strong>
                      <span>{percent(candidate.confidence)}</span>
                      <small>
                        <RubyLabel text={candidate.reasons.join('／')} />
                      </small>
                    </p>
                  ))}
                  <small>
                    <RubyLabel text={t('parent.diagnosisCaution')} />
                  </small>
                </div>
              ) : (
                <p>
                  <RubyLabel text={t('parent.noDiagnosis')} />
                </p>
              )}
            </section>
            <section class="nq-parent-card nq-parent-save">
              <h3>
                <RubyLabel text={t('parent.saveData')} />
              </h3>
              <div class="nq-parent-actions">
                <button
                  type="button"
                  class="nq-opt"
                  onClick={() => (setJson(exportGameJson(game)), setMessage(t('parent.exportDone')))}
                >
                  <RubyLabel text={t('parent.export')} />
                </button>
                <button type="button" class="nq-opt" disabled={!json.trim()} onClick={doImport}>
                  <RubyLabel text={t('parent.import')} />
                </button>
              </div>
              <textarea
                aria-label={displayText(t('parent.json'))}
                value={json}
                onInput={(ev) => setJson(ev.currentTarget.value)}
                placeholder={displayText(t('parent.jsonHelp'))}
              />
              {message && (
                <p role="status" class="nq-parent-message">
                  <RubyLabel text={message} />
                </p>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
