// @vitest-environment jsdom
import { h } from 'preact';
import { render } from 'preact/compat';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BattleHistory } from '../../src/ui/battle/BattleHistory';
import { HudStore } from '../../src/ui/battle/store';
import { setDictionary } from '../../src/ui/i18n';

beforeEach(() => {
  setDictionary({
    battle: {
      historyTitle: 'たたかいの きろく',
      historyEmpty: 'まだ きろくが ないよ',
      eventsOpen: 'イベント',
      eventsTitle: 'イベント タイムライン',
      eventsClose: 'とじる',
      eventsOmitted: '前の {n}件を 省略',
      timelineTurn: 'T{n}',
      timelineSide: 'side={value}',
      timelineActor: 'actor={value}',
      timelineTarget: 'target={value}',
      timelineCommand: 'command={value}',
      timelineSkill: 'skill={value}',
      timelineHp: 'HP {before}→{after} ({delta})',
    },
  });
});

afterEach(() => {
  render(null, document.body);
  document.body.replaceChildren();
});

function storeWithHistory(): HudStore {
  const store = new HudStore();
  store.set({
    history: {
      recent: [{ eventIndex: 2, lines: ['ハルの こうげき！'] }],
      timeline: [
        {
          eventIndex: 2,
          turn: 1,
          t: 'damage',
          side: 'enemy',
          targetId: 'enemy',
          hp: { before: 20, after: 15, delta: -5 },
        },
      ],
      totalPresentedEvents: 2,
      omittedTimelineEvents: 0,
    },
  });
  return store;
}

describe('BattleHistory', () => {
  it('renders recent narration without a live region and hides developer controls normally', () => {
    render(h(BattleHistory, { store: storeWithHistory(), devMode: false, visible: true }), document.body);

    const history = document.querySelector<HTMLElement>('[data-battle-history]');
    expect(history?.getAttribute('aria-live')).toBe('off');
    expect(history?.textContent).toContain('ハルの こうげき！');
    expect(document.querySelector('[data-event-timeline-toggle]')).toBeNull();
  });

  it('opens the developer timeline and Escape closes it with focus restored', async () => {
    render(h(BattleHistory, { store: storeWithHistory(), devMode: true, visible: true }), document.body);
    const toggle = document.querySelector<HTMLButtonElement>('[data-event-timeline-toggle]')!;

    toggle.click();
    await Promise.resolve();
    const timeline = document.querySelector<HTMLElement>('[data-event-timeline]')!;
    expect(timeline.getAttribute('aria-live')).not.toBe('polite');
    expect(timeline.textContent).toContain('#2');
    expect(timeline.textContent).toContain('20→15');

    timeline.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelector('[data-event-timeline]')).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });
});
