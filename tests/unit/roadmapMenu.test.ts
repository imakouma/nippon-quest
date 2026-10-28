// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import type {
  RoadmapCompletedReason,
  RoadmapNode,
  RoadmapPendingReason,
  RoadmapTodayItem,
  RoadmapViewModel,
} from '../../src/shared/menuModel';
import { MenuOverlay } from '../../src/ui/field/MenuOverlay';
import { RoadmapGraph } from '../../src/ui/field/RoadmapGraph';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

vi.mock('../../src/ui/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../../src/ui/PixelIcon', () => ({ PixelIcon: () => null }));

beforeAll(() => {
  const dictionary = JSON.parse(readFileSync('content/i18n/ja.json', 'utf8')) as I18nDict;
  setDictionary(dictionary);
});

afterEach(() => {
  render(null, document.body);
  document.body.replaceChildren();
  vi.clearAllMocks();
});

const nodes: RoadmapNode[] = [
  {
    id: 'kokugo.g1.hiragana',
    name: 'ひらがな',
    subject: 'kokugo',
    subjectLabel: 'こくご',
    grade: 1,
    recommendedTerms: [1],
    courseKind: 'required-subject',
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: [],
    x: 72,
    y: 64,
    visibility: 'revealed',
    state: 'current',
  },
  {
    id: 'kokugo.g2.kanji',
    name: '二年生[にねんせい]の 漢字[かんじ]',
    subject: 'kokugo',
    subjectLabel: 'こくご',
    grade: 2,
    recommendedTerms: [1],
    courseKind: 'required-subject',
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: ['kokugo.g1.hiragana'],
    x: 72,
    y: 138,
    visibility: 'frontier',
    state: 'locked',
  },
  {
    id: 'kokugo.g3.kanji',
    name: '三年生[さんねんせい]の 漢字[かんじ]',
    subject: 'kokugo',
    subjectLabel: 'こくご',
    grade: 3,
    recommendedTerms: [1],
    courseKind: 'required-subject',
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: ['kokugo.g1.hiragana'],
    x: 72,
    y: 212,
    visibility: 'hidden',
    state: 'locked',
  },
  {
    id: 'sansu.g1.kazu-10',
    name: '10までのかず',
    subject: 'sansu',
    subjectLabel: '算数[さんすう]',
    grade: 1,
    recommendedTerms: [1],
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: [],
    x: 72,
    y: 64,
    visibility: 'revealed',
    state: 'current',
  },
  {
    id: 'sansu.g2.kakezan',
    name: 'かけ算[ざん]',
    subject: 'sansu',
    subjectLabel: '算数[さんすう]',
    grade: 2,
    recommendedTerms: [2],
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: ['sansu.g1.kazu-10'],
    x: 252,
    y: 212,
    visibility: 'frontier',
    state: 'locked',
  },
  {
    id: 'sansu.g1.legacy',
    name: 'じき未設定[みせってい]の単元[たんげん]',
    subject: 'sansu',
    subjectLabel: '算数[さんすう]',
    grade: 1,
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: [],
    x: 252,
    y: 64,
    visibility: 'revealed',
    state: 'open',
  },
  {
    id: 'sansu.g3.warizan',
    name: 'わり算[ざん]',
    subject: 'sansu',
    subjectLabel: 'さんすう',
    grade: 3,
    recommendedTerms: [1],
    courseKind: 'required-subject',
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: [],
    x: 72,
    y: 360,
    visibility: 'hidden',
    state: 'locked',
  },
  {
    id: 'rika.g3.light',
    name: '光[ひかり]の せいしつ',
    subject: 'rika',
    subjectLabel: '理科[りか]',
    grade: 3,
    recommendedTerms: [1],
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: [],
    x: 72,
    y: 64,
    visibility: 'hidden',
    state: 'locked',
  },
  {
    id: 'shakai.g3.machi',
    name: 'まちの ようす',
    subject: 'shakai',
    subjectLabel: 'しゃかい',
    grade: 3,
    recommendedTerms: [1],
    courseKind: 'required-subject',
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: [],
    x: 72,
    y: 64,
    visibility: 'hidden',
    state: 'locked',
  },
  {
    id: 'seikatsu.g1.school',
    name: '学校[がっこう]せいかつ',
    subject: 'seikatsu',
    subjectLabel: 'せいかつ',
    grade: 1,
    recommendedTerms: [1],
    courseKind: 'required-subject',
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: [],
    x: 72,
    y: 64,
    visibility: 'revealed',
    state: 'current',
  },
  {
    id: 'seikatsu.g2.ikimono',
    name: '生[い]きもの',
    subject: 'seikatsu',
    subjectLabel: 'せいかつ',
    grade: 2,
    recommendedTerms: [1],
    courseKind: 'required-subject',
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: ['seikatsu.g1.school'],
    x: 72,
    y: 138,
    visibility: 'frontier',
    state: 'locked',
  },
  {
    id: 'eigo.g1.alphabet',
    name: 'アルファベット',
    subject: 'eigo',
    subjectLabel: '英語[えいご]',
    grade: 1,
    recommendedTerms: ['variable'],
    courseKind: 'supplementary',
    mastery: 0,
    attempts: 0,
    retention: 0,
    prerequisiteIds: [],
    x: 72,
    y: 64,
    visibility: 'revealed',
    state: 'open',
  },
];

async function showRoadmap(
  onRoadmapSelect: (unitId: string) => void,
  initialHome = true,
  developerMode = false,
  options: {
    container?: HTMLElement;
    roadmapView?: RoadmapViewModel;
    roadmapReturnQuestionId?: string;
    onRoadmapTodaySelect?: (questionId: string) => void;
  } = {},
): Promise<HTMLElement> {
  const container = options.container ?? document.createElement('div');
  if (!options.container) document.body.append(container);
  await act(async () =>
    render(
      h(MenuOverlay, {
        tab: 'roadmap',
        tabs: [{ key: 'roadmap', label: 'がくしゅう', icon: 'star' }],
        entries: [],
        roadmap: nodes,
        roadmapView: options.roadmapView,
        roadmapReturnQuestionId: options.roadmapReturnQuestionId,
        developerMode,
        empty: '',
        message: null,
        initialHome,
        keys: '',
        onTab: vi.fn(),
        onBag: vi.fn(),
        onAct: vi.fn(),
        onRoadmapSelect,
        onRoadmapTodaySelect: options.onRoadmapTodaySelect ?? vi.fn(),
        onSave: vi.fn(),
        onParent: vi.fn(),
        onClose: vi.fn(),
      } as unknown as Parameters<typeof MenuOverlay>[0]),
      container,
    ),
  );
  if (initialHome)
    await act(async () => container.querySelector<HTMLButtonElement>('.nq-menu-card')!.click());
  return container;
}

const todayProgress = {
  mastery: 0,
  attempts: 0,
  retention: 0,
  state: 'current' as const,
};

function pendingTodayItem(
  questionId: string,
  reason: RoadmapPendingReason,
  overrides: Partial<RoadmapTodayItem> = {},
): RoadmapTodayItem {
  return {
    questionId,
    actualUnitId: `unit.${questionId}`,
    unitName: '10までの かず',
    subject: 'sansu',
    subjectLabel: '算数[さんすう]',
    grade: 1,
    conceptIds: [],
    progress: todayProgress,
    completed: false,
    reason,
    ...overrides,
  } as RoadmapTodayItem;
}

function completedTodayItem(
  questionId: string,
  reason: RoadmapCompletedReason,
  overrides: Partial<RoadmapTodayItem> = {},
): RoadmapTodayItem {
  return {
    questionId,
    actualUnitId: `unit.${questionId}`,
    unitName: '10までの かず',
    subject: 'sansu',
    subjectLabel: '算数[さんすう]',
    grade: 1,
    conceptIds: [],
    progress: todayProgress,
    completed: true,
    reason,
    ...overrides,
  } as RoadmapTodayItem;
}

function roadmapView(items: RoadmapTodayItem[], allComplete = false): RoadmapViewModel {
  return { nodes, todayPlan: { items, allComplete } };
}

function subjectButton(container: HTMLElement, subject: string): HTMLButtonElement {
  return container.querySelector<HTMLButtonElement>(`.nq-roadmap-subject[data-subject="${subject}"]`)!;
}

function gradeButton(container: HTMLElement, grade: string): HTMLButtonElement {
  return container.querySelector<HTMLButtonElement>(`.nq-roadmap-grade[data-grade="${grade}"]`)!;
}

function termButton(container: HTMLElement, term: string): HTMLButtonElement {
  return container.querySelector<HTMLButtonElement>(`.nq-roadmap-term[data-term="${term}"]`)!;
}

describe('きょうの3つ', () => {
  it('上流の順番どおり0〜3件だけを表示し、空の枠や無効ボタンを足さない', async () => {
    const items = [
      pendingTodayItem('q-1', 'due-review'),
      pendingTodayItem('q-2', 'weak-prerequisite', {
        subject: 'kokugo',
        subjectLabel: '国語[こくご]',
        unitName: 'ひらがな',
      }),
      completedTodayItem('q-3', 'review'),
    ];

    for (const count of [0, 1, 2, 3]) {
      const container = await showRoadmap(vi.fn(), true, false, {
        roadmapView: roadmapView(items.slice(0, count)),
      });
      const cards = [...container.querySelectorAll<HTMLElement>('.nq-roadmap-today-item')];

      expect(cards).toHaveLength(count);
      expect(cards.map((card) => card.dataset.roadmapQuestionId)).toEqual(
        items.slice(0, count).map((item) => item.questionId),
      );
      expect(container.querySelector('.nq-roadmap-today-placeholder')).toBeNull();
      expect(container.querySelector('.nq-roadmap-today button:disabled')).toBeNull();
    }
  });

  it.each([
    ['due-review', '復習', '時期'],
    ['weak-prerequisite', 'さきに ここから', ''],
    ['unseen-primary', 'あたらしい 学', ''],
    ['unseen-question', 'まだ といていない 問題', ''],
  ] as const)('%s の理由を責めない文で表示する', async (reason, expected, extra) => {
    const container = await showRoadmap(vi.fn(), true, false, {
      roadmapView: roadmapView([pendingTodayItem(`q-${reason}`, reason)]),
    });
    const item = container.querySelector<HTMLElement>('.nq-roadmap-today-item')!;

    expect(item.textContent).toContain('算数');
    expect(item.textContent).toContain('10までの かず');
    expect(item.textContent).toContain(expected);
    if (extra) expect(item.textContent).toContain(extra);
  });

  it.each([
    ['review', ['復習', 'できた']],
    ['diagnosis', ['取', '組', 'めた']],
  ] as const)('%s の完了理由を一般文で静的表示する', async (reason, expectedParts) => {
    const container = await showRoadmap(vi.fn(), true, false, {
      roadmapView: roadmapView([completedTodayItem(`q-${reason}`, reason)], true),
    });
    const item = container.querySelector<HTMLElement>('.nq-roadmap-today-item')!;

    expect(item.textContent).toContain('✓');
    for (const part of expectedParts) expect(item.textContent).toContain(part);
    expect(item.querySelector('button')).toBeNull();
  });

  it('候補0件と全完了をallCompleteで区別する', async () => {
    const empty = await showRoadmap(vi.fn(), true, false, {
      roadmapView: roadmapView([]),
    });
    const complete = await showRoadmap(vi.fn(), true, false, {
      roadmapView: roadmapView([completedTodayItem('q-done', 'review')], true),
    });

    expect(empty.querySelector('.nq-roadmap-today-empty')?.textContent).toContain('おすすめ');
    expect(empty.querySelector('.nq-roadmap-today-empty')?.textContent).not.toContain('ぜんぶ');
    expect(complete.querySelector('.nq-roadmap-today-complete')?.textContent).toContain('ぜんぶ');
  });

  it('未完了のnative buttonだけがquestionIdを1回通知する', async () => {
    const onRoadmapTodaySelect = vi.fn();
    const container = await showRoadmap(vi.fn(), true, false, {
      roadmapView: roadmapView([
        pendingTodayItem('question-exact', 'unseen-question', {
          actualUnitId: 'sansu.g1.kazu-10',
        }),
        completedTodayItem('question-done', 'diagnosis'),
      ]),
      onRoadmapTodaySelect,
    });
    const start = container.querySelector<HTMLButtonElement>('.nq-roadmap-today-start')!;

    expect(start.tagName).toBe('BUTTON');
    await act(async () => start.click());

    expect(onRoadmapTodaySelect).toHaveBeenCalledTimes(1);
    expect(onRoadmapTodaySelect).toHaveBeenCalledWith('question-exact');
    expect(onRoadmapTodaySelect).not.toHaveBeenCalledWith('sansu.g1.kazu-10');
  });
});

describe('きょうの3つのフォーカスと通知', () => {
  it('初回表示では先頭の未完了CTAへフォーカスする', async () => {
    const container = await showRoadmap(vi.fn(), true, false, {
      roadmapView: roadmapView([
        pendingTodayItem('q-first', 'due-review'),
        pendingTodayItem('q-second', 'unseen-primary'),
      ]),
      onRoadmapTodaySelect: vi.fn(),
    });

    expect(document.activeElement).toBe(
      container.querySelector('[data-roadmap-question-id="q-first"][data-roadmap-focus-target]'),
    );
  });

  it('回答後は同じ完了項目へフォーカスし、進捗をpoliteかつatomicに通知する', async () => {
    const container = await showRoadmap(vi.fn(), false, false, {
      roadmapView: roadmapView([completedTodayItem('q-return', 'diagnosis')], true),
      roadmapReturnQuestionId: 'q-return',
      onRoadmapTodaySelect: vi.fn(),
    });
    await act(async () => undefined);

    const completed = container.querySelector<HTMLElement>(
      '[data-roadmap-question-id="q-return"][data-roadmap-focus-target]',
    )!;
    const status = container.querySelector<HTMLElement>('.nq-roadmap-today-status')!;
    expect(document.activeElement).toBe(completed);
    expect(completed.getAttribute('tabindex')).toBe('-1');
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-atomic')).toBe('true');
    expect(status.textContent).toContain('10までの かず');
    expect(status.textContent).toContain('1/1');
  });

  it('開始元が消えた場合はきょうの3つ見出しへフォーカスを戻す', async () => {
    const container = await showRoadmap(vi.fn(), false, false, {
      roadmapView: roadmapView([]),
      roadmapReturnQuestionId: 'q-missing',
      onRoadmapTodaySelect: vi.fn(),
    });
    await act(async () => undefined);

    const heading = container.querySelector<HTMLElement>('.nq-roadmap-today-title')!;
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute('tabindex')).toBe('-1');
  });

  it('同じ回答復帰propsの再描画では完了通知を更新しない', async () => {
    const model = roadmapView([completedTodayItem('q-once', 'review')], true);
    const onRoadmapTodaySelect = vi.fn();
    const container = await showRoadmap(vi.fn(), false, false, {
      roadmapView: model,
      roadmapReturnQuestionId: 'q-once',
      onRoadmapTodaySelect,
    });
    await act(async () => undefined);
    const status = container.querySelector<HTMLElement>('.nq-roadmap-today-status')!;
    const onMutation = vi.fn();
    const observer = new MutationObserver(onMutation);
    observer.observe(status, { childList: true, characterData: true, subtree: true });

    await showRoadmap(vi.fn(), false, false, {
      container,
      roadmapView: model,
      roadmapReturnQuestionId: 'q-once',
      onRoadmapTodaySelect,
    });
    await act(async () => undefined);

    observer.disconnect();
    expect(onMutation).not.toHaveBeenCalled();
  });
});

describe('きょうの3つのレスポンシブ・モーション・入力', () => {
  it('狭幅と低高さのレイアウト、48px操作面、reduced-motionをCSSで保証する', () => {
    const css = readFileSync('src/ui/field/menu.css', 'utf8');

    expect(css).toMatch(
      /@media\s+\(max-width:\s*700px\)[\s\S]*?\.nq-roadmap-today-list\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    );
    expect(css).toMatch(/@media\s+\(max-height:\s*420px\)[\s\S]*?\.nq-roadmap-overview\s*\{/);
    expect(css).toMatch(
      /\.nq-roadmap-today-start,[\s\S]*?\.nq-roadmap-today-done\s*\{[\s\S]*?min-height:\s*48px/,
    );
    expect(css).toMatch(
      /@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.nq-roadmap-current\s+\.nq-roadmap-step\s*\{[\s\S]*?animation:\s*none/,
    );
  });

  it('today CTAのnative Enter・Spaceをglobal handlerで二重処理しない', async () => {
    const onRoadmapTodaySelect = vi.fn();
    const container = await showRoadmap(vi.fn(), false, false, {
      roadmapView: roadmapView([pendingTodayItem('q-keyboard', 'unseen-primary')]),
      onRoadmapTodaySelect,
    });
    const start = container.querySelector<HTMLButtonElement>('.nq-roadmap-today-start')!;
    start.focus();

    await act(async () => {
      start.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      start.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    });
    expect(onRoadmapTodaySelect).not.toHaveBeenCalled();

    await act(async () => start.click());
    expect(onRoadmapTodaySelect).toHaveBeenCalledTimes(1);
  });

  it('Escapeで既存どおりロードマップからメニューホームへ戻る', async () => {
    const container = await showRoadmap(vi.fn(), false, false, {
      roadmapView: roadmapView([pendingTodayItem('q-escape', 'due-review')]),
      onRoadmapTodaySelect: vi.fn(),
    });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(container.querySelector('.nq-menu-home')).not.toBeNull();
    expect(container.querySelector('.nq-roadmap')).toBeNull();
  });
});

describe('学習ロードマップの単元選択', () => {
  it('通常モードでは解放済み教科だけを全文表示し、現在学んでいる学年も伝える', async () => {
    const container = await showRoadmap(vi.fn());
    const subjectButtons = [...container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-subject')];

    expect(subjectButtons.map((button) => button.dataset.subject)).toEqual([
      'all',
      'kokugo',
      'sansu',
      'seikatsu',
    ]);
    expect(
      subjectButtons.map((button) => button.querySelector('.nq-roadmap-subject-name')?.textContent),
    ).toEqual(['全教科', '国語', '算数', '生活科']);
    expect(subjectButton(container, 'sansu').textContent).toContain('1年');
    expect(subjectButton(container, 'sansu').getAttribute('aria-label')).toBe('算数・いまは 1年生');
    expect(subjectButtons.every((button) => button.title === button.getAttribute('aria-label'))).toBe(true);
  });

  it('通常モードでは学年・おすすめ時期の開発用フィルタを表示しない', async () => {
    const container = await showRoadmap(vi.fn());

    expect(container.querySelector('.nq-roadmap-filter-row')).toBeNull();
    expect(container.querySelector('.nq-roadmap-toolbar-compact')).not.toBeNull();
    expect(container.querySelector('.nq-roadmap-period-note')).toBeNull();
  });

  it('開発者モードでは学年・時期フィルタと全教科を表示する', async () => {
    const container = await showRoadmap(vi.fn(), true, true);

    expect(container.querySelector('.nq-roadmap-filter-row')).not.toBeNull();
    expect(container.querySelectorAll('.nq-roadmap-grade')).toHaveLength(7);
    expect(container.querySelectorAll('.nq-roadmap-term')).toHaveLength(4);
    expect(
      [...container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-subject')].map(
        (button) => button.dataset.subject,
      ),
    ).toEqual(['all', 'kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo']);
  });

  it('1・2年生では国語・算数・生活科だけを全文で表示する', async () => {
    const container = await showRoadmap(vi.fn(), true, true);

    for (const value of ['1', '2']) {
      await act(async () => {
        gradeButton(container, value).click();
      });

      const subjectButtons = [...container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-subject')];
      expect(subjectButtons.map((button) => button.dataset.subject)).toEqual([
        'all',
        'kokugo',
        'sansu',
        'seikatsu',
      ]);
      expect(
        subjectButtons.map((button) => button.querySelector('.nq-roadmap-subject-name')?.textContent),
      ).toEqual(['全教科', '国語', '算数', '生活科']);
      expect(
        subjectButtons.slice(1).every((button) => button.classList.contains('nq-roadmap-subject-long')),
      ).toBe(true);
    }
  });

  it('3〜6年生でも教科名を全文表示する', async () => {
    const container = await showRoadmap(vi.fn(), true, true);

    await act(async () => {
      gradeButton(container, '3').click();
    });

    const subjectButtons = [...container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-subject')];
    expect(subjectButtons.map((button) => button.dataset.subject)).toEqual([
      'all',
      'kokugo',
      'sansu',
      'rika',
      'shakai',
    ]);
    expect(
      subjectButtons.map((button) => button.querySelector('.nq-roadmap-subject-name')?.textContent),
    ).toEqual(['全教科', '国語', '算数', '理科', '社会']);
    expect(
      subjectButtons.slice(1).every((button) => button.classList.contains('nq-roadmap-subject-long')),
    ).toBe(true);
  });

  it('全教科の先頭に次のおすすめを表示し、押すと該当教科へ移動する', async () => {
    const container = await showRoadmap(vi.fn());
    const recommendation = container.querySelector<HTMLButtonElement>('.nq-roadmap-recommendation')!;

    expect(recommendation.textContent).toContain('つぎの おすすめ');
    expect(recommendation.textContent).toContain('ひらがな');

    await act(async () => recommendation.click());

    expect(subjectButton(container, 'kokugo').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.nq-roadmap-map')).not.toBeNull();
  });

  it('時期の説明をタッチ・キーボードで開閉できるボタンとして表示する', async () => {
    const container = await showRoadmap(vi.fn(), true, true);
    const info = container.querySelector<HTMLButtonElement>('.nq-roadmap-period-note')!;

    expect(info.tagName).toBe('BUTTON');
    expect(info.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.nq-roadmap-period-help')).toBeNull();

    await act(async () => info.click());

    expect(info.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('.nq-roadmap-period-help')?.textContent).toContain('学校');
    expect(container.querySelector('.nq-roadmap-period-help')?.textContent).toContain('かわります');
  });

  it('未到達の教科をクリア済みと表示しない', async () => {
    const container = await showRoadmap(vi.fn(), true, true);
    const science = container.querySelector<HTMLButtonElement>('.nq-roadmap-summary-rika');

    expect(science?.textContent).toContain('まだ');
    expect(science?.textContent).not.toContain('クリア');
  });

  it('ロードマップ下部に状態の凡例を表示しない', async () => {
    const container = await showRoadmap(vi.fn());

    expect(container.querySelector('.nq-roadmap-help')).toBeNull();
  });

  it('問題の回答後はロードマップへ直接戻せる', async () => {
    const container = await showRoadmap(vi.fn(), false);

    expect(container.querySelector('.nq-roadmap')).not.toBeNull();
    expect(container.querySelector('.nq-menu-home')).toBeNull();
  });

  it('開いている単元を選び、主要ボタンを押したときだけ問題開始を通知する', async () => {
    const onRoadmapSelect = vi.fn();
    const container = await showRoadmap(onRoadmapSelect);

    await act(async () => {
      subjectButton(container, 'sansu').click();
    });
    const unit = [...container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-node')].find((button) =>
      button.textContent?.includes('10までのかず'),
    );
    expect(unit).toBeDefined();

    await act(async () => unit!.click());

    expect(onRoadmapSelect).not.toHaveBeenCalled();
    expect(unit!.hasAttribute('aria-pressed')).toBe(false);
    expect(unit!.getAttribute('aria-label')).toContain('えらんでいる');
    const selection = container.querySelector<HTMLElement>('.nq-roadmap-selection')!;
    expect(selection.textContent).toContain('10までのかず');
    expect(selection.textContent).toContain('1ねん');
    expect(selection.textContent).toContain('いまの もくひょう');
    expect(selection.querySelector('.nq-roadmap-practice-label')?.textContent).toContain('ここを');
    expect(selection.querySelector('.nq-roadmap-practice-arrow')?.getAttribute('aria-hidden')).toBe('true');

    await act(async () => container.querySelector<HTMLButtonElement>('.nq-roadmap-practice')!.click());

    expect(onRoadmapSelect).toHaveBeenCalledWith('sansu.g1.kazu-10');
  });

  it('開いた直後は現在の単元を選び、別の単元へ選択を切り替えられる', async () => {
    const onRoadmapSelect = vi.fn();
    const container = await showRoadmap(onRoadmapSelect);

    await act(async () => {
      subjectButton(container, 'sansu').click();
    });

    const current = container.querySelector<HTMLButtonElement>('.nq-roadmap-current')!;
    expect(current.hasAttribute('aria-pressed')).toBe(false);
    expect(current.getAttribute('aria-label')).toContain('えらんでいる');
    expect(container.querySelector('.nq-roadmap-selection')?.textContent).toContain('10までのかず');

    const open = [...container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-open')].find((button) =>
      button.textContent?.includes('じき未設定'),
    )!;
    await act(async () => open.click());

    expect(current.hasAttribute('aria-pressed')).toBe(false);
    expect(current.getAttribute('aria-label')).not.toContain('えらんでいる');
    expect(open.hasAttribute('aria-pressed')).toBe(false);
    expect(open.getAttribute('aria-label')).toContain('えらんでいる');
    expect(container.querySelector('.nq-roadmap-selection')?.textContent).toContain('じき未設定');
    expect(onRoadmapSelect).not.toHaveBeenCalled();
  });

  it('地図の背景を押すと単元選択と詳細パネルを閉じる', async () => {
    const container = await showRoadmap(vi.fn());

    await act(async () => {
      subjectButton(container, 'sansu').click();
    });

    const current = container.querySelector<HTMLButtonElement>('.nq-roadmap-current')!;
    expect(current.getAttribute('aria-label')).toContain('えらんでいる');
    expect(container.querySelector('.nq-roadmap-selection')).not.toBeNull();
    expect(
      container
        .querySelector('.nq-roadmap-map-shell')
        ?.classList.contains('nq-roadmap-map-shell-with-selection'),
    ).toBe(true);

    await act(async () => container.querySelector<HTMLElement>('.nq-roadmap-map')!.click());

    expect(current.getAttribute('aria-label')).not.toContain('えらんでいる');
    expect(container.querySelector('.nq-roadmap-selection')).toBeNull();
    expect(
      container
        .querySelector('.nq-roadmap-map-shell')
        ?.classList.contains('nq-roadmap-map-shell-with-selection'),
    ).toBe(false);
  });

  it('ロック中の単元を選ぶと、不足している前提条件を確認できるが問題は開始できない', async () => {
    const onRoadmapSelect = vi.fn();
    const container = await showRoadmap(onRoadmapSelect);

    await act(async () => {
      subjectButton(container, 'sansu').click();
    });
    const locked = container.querySelector<HTMLButtonElement>('.nq-roadmap-frontier');
    expect(locked?.disabled).toBe(false);
    expect(locked?.getAttribute('aria-disabled')).toBeNull();
    expect(locked?.getAttribute('aria-label')).toContain('0/1');
    await act(async () => locked!.click());

    expect(onRoadmapSelect).not.toHaveBeenCalled();
    expect(locked!.hasAttribute('aria-pressed')).toBe(false);
    expect(locked!.getAttribute('aria-label')).toContain('えらんでいる');
    expect(locked!.textContent).not.toContain('かけ算');
    expect(locked!.textContent).toContain('？');
    const conditions = container.querySelector<HTMLElement>('.nq-roadmap-prerequisites');
    expect(conditions?.textContent).toContain('0/1');
    expect(conditions?.textContent).toContain('10までのかず');
    expect(conditions?.textContent).toContain('まだ');
    expect(container.querySelector('.nq-roadmap-selection-name')?.textContent).toContain('まだ');
    expect(container.querySelector('.nq-roadmap-selection-name')?.textContent).toContain('見');
    expect(container.querySelector('.nq-roadmap-selection-name')?.textContent).not.toContain('かけ算');
    expect(container.querySelector('.nq-roadmap-practice')).toBeNull();

    const prerequisite = container.querySelector<HTMLButtonElement>('.nq-roadmap-prerequisite')!;
    expect(prerequisite.tagName).toBe('BUTTON');
    await act(async () => prerequisite.click());
    expect(container.querySelector('.nq-roadmap-selection-name')?.textContent).toContain('10までのかず');
  });

  it('前提関係を接続線で描き、霧の向こうの単元名は読み上げない', async () => {
    const container = await showRoadmap(vi.fn());

    await act(async () => {
      subjectButton(container, 'sansu').click();
    });

    expect(container.querySelectorAll('.nq-roadmap-edge')).toHaveLength(1);
    const route = container.querySelector('.nq-roadmap-edge');
    expect(route?.getAttribute('d')).toMatch(/^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);
    expect(route?.getAttribute('d')).not.toContain(' C ');
    expect(container.querySelector('.nq-roadmap-frontier')?.getAttribute('aria-label')).toContain(
      'まだ 見えない',
    );
    expect(container.querySelector('.nq-roadmap-frontier')?.getAttribute('aria-label')).not.toContain(
      'かけ算',
    );
  });

  it('選択中の進路だけを強調し、ほかの前提線は背景へ下げる', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const chain: RoadmapNode[] = [
      nodes.find((node) => node.id === 'sansu.g1.kazu-10')!,
      {
        ...nodes.find((node) => node.id === 'sansu.g2.kakezan')!,
        visibility: 'revealed',
        state: 'open',
      },
      {
        ...nodes.find((node) => node.id === 'sansu.g3.warizan')!,
        prerequisiteIds: ['sansu.g2.kakezan'],
        visibility: 'frontier',
      },
    ];
    await act(async () => render(h(RoadmapGraph, { nodes: chain, onSelect: vi.fn() }), container));

    expect(container.querySelectorAll('.nq-roadmap-edge-active').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.nq-roadmap-edge-muted').length).toBeGreaterThan(0);
  });

  it('学年とおすすめ時期を別々のボタンで絞り込める', async () => {
    const container = await showRoadmap(vi.fn(), true, true);

    await act(async () => {
      subjectButton(container, 'sansu').click();
      gradeButton(container, '1').click();
      termButton(container, '1').click();
    });

    expect(container.textContent).toContain('10までのかず');
    expect(container.textContent).not.toContain('かけ算');
    expect(container.textContent).toContain('じき未設定');
    expect(container.querySelectorAll('.nq-roadmap-toolbar')).toHaveLength(1);
    expect(container.querySelector('.nq-roadmap-toolbar-compact')).toBeNull();
    expect(container.querySelector('.nq-roadmap-period-range')).toBeNull();
    expect(container.querySelectorAll('.nq-roadmap-grade')).toHaveLength(7);
    expect(container.querySelectorAll('.nq-roadmap-term')).toHaveLength(4);
    expect(gradeButton(container, '1').getAttribute('aria-pressed')).toBe('true');
    expect(termButton(container, '1').getAttribute('aria-pressed')).toBe('true');
  });

  it('学年で絞り込んでも、対象単元へつながる前提ノードと線を残す', async () => {
    const container = await showRoadmap(vi.fn(), true, true);
    await act(async () => {
      gradeButton(container, '2').click();
      termButton(container, '2').click();
      subjectButton(container, 'sansu').click();
    });

    expect(container.querySelectorAll('.nq-roadmap-node')).toHaveLength(2);
    expect(container.querySelectorAll('.nq-roadmap-edge')).toHaveLength(1);
    expect(container.textContent).toContain('10までのかず');
  });

  it('1・2年生では補助教材を教科一覧と必修進捗に含めない', async () => {
    const container = await showRoadmap(vi.fn(), true, true);
    await act(async () => {
      gradeButton(container, '1').click();
    });

    expect(container.querySelector('.nq-roadmap-subject[data-subject="eigo"]')).toBeNull();
    expect(container.textContent).not.toContain('おまけ');
    expect(container.querySelector('.nq-roadmap-score')?.textContent).toContain('0/4');
  });

  it('操作ボタンを置かず、初回ヒントを操作後に消して拡大と移動ができる', async () => {
    const container = await showRoadmap(vi.fn());

    await act(async () => {
      subjectButton(container, 'sansu').click();
    });

    expect(container.querySelector('.nq-roadmap-map-tools')).toBeNull();
    expect(container.querySelector('.nq-roadmap-zoom-out')).toBeNull();
    expect(container.querySelector('.nq-roadmap-zoom-value')).toBeNull();
    expect(container.querySelector('.nq-roadmap-zoom-in')).toBeNull();
    expect(container.querySelector('.nq-roadmap-reset')).toBeNull();

    const map = container.querySelector<HTMLElement>('.nq-roadmap-map')!;
    const canvas = container.querySelector<HTMLElement>('.nq-roadmap-canvas')!;
    expect(container.querySelector('.nq-roadmap-gesture-hint')?.textContent).toContain('ドラッグ');
    await act(async () => {
      map.dispatchEvent(
        new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
          ctrlKey: true,
          deltaY: -20,
        }),
      );
    });
    expect(canvas.style.transform).toContain('scale(1.1)');
    expect(container.querySelector('.nq-roadmap-gesture-hint')).toBeNull();

    const beforePan = canvas.style.transform;
    await act(async () => {
      map.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 20, deltaY: 10 }));
    });
    expect(canvas.style.transform).not.toBe(beforePan);
  });

  it('地図を20%まで縮小できる', async () => {
    const container = await showRoadmap(vi.fn());

    await act(async () => {
      subjectButton(container, 'sansu').click();
    });

    const map = container.querySelector<HTMLElement>('.nq-roadmap-map')!;
    await act(async () => {
      map.dispatchEvent(
        new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
          ctrlKey: true,
          deltaY: 500,
        }),
      );
    });

    expect(container.querySelector<HTMLElement>('.nq-roadmap-canvas')!.style.transform).toContain(
      'scale(0.2)',
    );
    expect(container.querySelector('.nq-roadmap-map-shell')?.getAttribute('data-zoom-detail')).toBe(
      'overview',
    );
  });

  it('表示中の単元を選び替えても地図位置を動かさない', async () => {
    const container = await showRoadmap(vi.fn());

    await act(async () => {
      subjectButton(container, 'sansu').click();
    });

    const map = container.querySelector<HTMLElement>('.nq-roadmap-map')!;
    Object.defineProperties(map, {
      clientWidth: { configurable: true, value: 800 },
      clientHeight: { configurable: true, value: 300 },
    });
    const openNode = container.querySelector<HTMLButtonElement>(
      '.nq-roadmap-node[aria-label="じき未設定の単元"]',
    )!;
    const currentNode = container.querySelector<HTMLButtonElement>('.nq-roadmap-current')!;
    await act(async () => map.click());
    await act(async () => currentNode.click());
    const before = container.querySelector<HTMLElement>('.nq-roadmap-canvas')!.style.transform;
    await act(async () => openNode.click());
    expect(container.querySelector<HTMLElement>('.nq-roadmap-canvas')!.style.transform).toBe(before);
    await act(async () => currentNode.click());

    expect(container.querySelector<HTMLElement>('.nq-roadmap-canvas')!.style.transform).toBe(before);
  });

  it('画面外の単元は中央ではなく、全体が見える位置までだけ動かす', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const distantNodes: RoadmapNode[] = [
      { ...nodes.find((node) => node.id === 'sansu.g1.kazu-10')!, x: 0, y: 64 },
      {
        ...nodes.find((node) => node.id === 'sansu.g1.legacy')!,
        x: 1200,
        y: 64,
      },
    ];
    await act(async () => render(h(RoadmapGraph, { nodes: distantNodes, onSelect: vi.fn() }), container));
    const map = container.querySelector<HTMLElement>('.nq-roadmap-map')!;
    Object.defineProperties(map, {
      clientWidth: { configurable: true, value: 800 },
      clientHeight: { configurable: true, value: 300 },
    });

    await act(async () => map.click());
    await act(async () => container.querySelector<HTMLButtonElement>('.nq-roadmap-current')!.click());
    await act(async () => container.querySelector<HTMLButtonElement>('.nq-roadmap-open')!.click());

    const transform = container.querySelector<HTMLElement>('.nq-roadmap-canvas')!.style.transform;
    const translateX = Number(transform.match(/translate\((-?[\d.]+)px/)?.[1]);
    const distantLeft = 1240 + translateX;
    const distantRight = distantLeft + 96;
    expect(distantLeft).toBeGreaterThan(400);
    expect(distantRight).toBe(800 - 24);
  });
});
