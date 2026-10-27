import type { JSX } from 'preact';
import { memo } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { useHudSelector, type BattleTimelineEntry, type HudState, type HudStore } from './store';

const selectHistory = (state: HudState) => state.history;

function timelineParts(entry: BattleTimelineEntry): string[] {
  const parts: string[] = [];
  if (entry.side) parts.push(t('battle.timelineSide', { value: entry.side }));
  if (entry.actorId) parts.push(t('battle.timelineActor', { value: entry.actorId }));
  if (entry.targetId) parts.push(t('battle.timelineTarget', { value: entry.targetId }));
  if (entry.command) parts.push(t('battle.timelineCommand', { value: entry.command }));
  if (entry.skillId) parts.push(t('battle.timelineSkill', { value: entry.skillId }));
  if (entry.hp) {
    parts.push(
      t('battle.timelineHp', {
        before: entry.hp.before,
        after: entry.hp.after,
        delta: entry.hp.delta > 0 ? `+${entry.hp.delta}` : entry.hp.delta,
      }),
    );
  }
  return parts;
}

interface BattleHistoryProps {
  store: HudStore;
  devMode: boolean;
  visible: boolean;
}

export const BattleHistory = memo(function BattleHistory({ store, devMode, visible }: BattleHistoryProps) {
  const history = useHudSelector(store, selectHistory);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (timelineOpen) closeRef.current?.focus();
  }, [timelineOpen]);

  useEffect(() => {
    if (!visible || !devMode) setTimelineOpen(false);
  }, [devMode, visible]);

  if (!visible) return null;

  const closeTimeline = () => {
    setTimelineOpen(false);
    queueMicrotask(() => toggleRef.current?.focus());
  };
  const onTimelineKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closeTimeline();
  };

  return (
    <>
      <section
        class="nq-win nq-history"
        aria-label={t('battle.historyTitle')}
        aria-live="off"
        data-battle-history
      >
        <header class="nq-history-head">
          <RubyLabel text={t('battle.historyTitle')} class="nq-history-title" />
          {devMode && (
            <button
              ref={toggleRef}
              type="button"
              class="nq-history-toggle"
              aria-expanded={timelineOpen}
              aria-controls="nq-event-timeline"
              data-event-timeline-toggle
              onClick={() => setTimelineOpen(true)}
            >
              {t('battle.eventsOpen')}
            </button>
          )}
        </header>
        {history.recent.length > 0 ? (
          <ol class="nq-history-list">
            {history.recent.map((entry) => (
              <li key={entry.eventIndex}>
                <RubyLabel text={entry.lines.join(' ')} />
              </li>
            ))}
          </ol>
        ) : (
          <RubyLabel text={t('battle.historyEmpty')} class="nq-history-empty" />
        )}
      </section>

      {devMode && timelineOpen && (
        <section
          id="nq-event-timeline"
          class="nq-win nq-timeline"
          aria-label={t('battle.eventsTitle')}
          aria-live="off"
          data-event-timeline
          onKeyDown={onTimelineKeyDown}
        >
          <header class="nq-timeline-head">
            <h2>{t('battle.eventsTitle')}</h2>
            <button ref={closeRef} type="button" class="nq-timeline-close" onClick={closeTimeline}>
              {t('battle.eventsClose')}
            </button>
          </header>
          {history.omittedTimelineEvents > 0 && (
            <p class="nq-timeline-omitted">
              {t('battle.eventsOmitted', { n: history.omittedTimelineEvents })}
            </p>
          )}
          <ol class="nq-timeline-list" start={history.timeline[0]?.eventIndex ?? 1}>
            {history.timeline.map((entry) => (
              <li key={entry.eventIndex}>
                <span class="nq-timeline-index">#{entry.eventIndex}</span>
                <span>{t('battle.timelineTurn', { n: entry.turn })}</span>
                <strong>{entry.t}</strong>
                {timelineParts(entry).map((part) => (
                  <span key={part}>{part}</span>
                ))}
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
});
