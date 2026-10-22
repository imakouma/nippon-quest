// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import type { RoadmapNode } from '../../src/shared/menuModel';
import { MenuOverlay } from '../../src/ui/field/MenuOverlay';
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
): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.append(container);
  render(
    h(MenuOverlay, {
      tab: 'roadmap',
      tabs: [{ key: 'roadmap', label: 'がくしゅう', icon: 'star' }],
      entries: [],
      roadmap: nodes,
      empty: '',
      message: null,
      initialHome,
      keys: '',
      onTab: vi.fn(),
      onBag: vi.fn(),
      onAct: vi.fn(),
      onRoadmapSelect,
      onSave: vi.fn(),
      onParent: vi.fn(),
      onClose: vi.fn(),
    } as unknown as Parameters<typeof MenuOverlay>[0]),
    container,
  );
  if (initialHome)
    await act(async () => container.querySelector<HTMLButtonElement>('.nq-menu-card')!.click());
  return container;
}

describe('学習ロードマップの単元選択', () => {
  it('未到達の教科をクリア済みと表示しない', async () => {
    const container = await showRoadmap(vi.fn());
    const science = container.querySelector<HTMLButtonElement>('.nq-roadmap-summary-rika');

    expect(science?.textContent).toContain('まだ');
    expect(science?.textContent).not.toContain('クリア');
  });

  it('問題の回答後はロードマップへ直接戻せる', async () => {
    const container = await showRoadmap(vi.fn(), false);

    expect(container.querySelector('.nq-roadmap')).not.toBeNull();
    expect(container.querySelector('.nq-menu-home')).toBeNull();
  });

  it('開いている単元を押すと、その単元の問題開始を通知する', async () => {
    const onRoadmapSelect = vi.fn();
    const container = await showRoadmap(onRoadmapSelect);

    await act(async () => {
      container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-subject')[1]!.click();
    });
    const unit = [...container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-node')].find((button) =>
      button.textContent?.includes('10までのかず'),
    );
    expect(unit).toBeDefined();

    await act(async () => unit!.click());

    expect(onRoadmapSelect).toHaveBeenCalledWith('sansu.g1.kazu-10');
  });

  it('ロック中の単元は問題を開始できない', async () => {
    const onRoadmapSelect = vi.fn();
    const container = await showRoadmap(onRoadmapSelect);

    await act(async () => {
      container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-subject')[1]!.click();
    });
    const locked = container.querySelector<HTMLButtonElement>('.nq-roadmap-frontier');
    expect(locked?.disabled).toBe(true);
    locked!.click();

    expect(onRoadmapSelect).not.toHaveBeenCalled();
    expect(locked!.textContent).not.toContain('かけ算');
    expect(locked!.textContent).toContain('？');
  });

  it('前提関係を接続線で描き、霧の向こうの単元名は読み上げない', async () => {
    const container = await showRoadmap(vi.fn());

    await act(async () => {
      container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-subject')[1]!.click();
    });

    expect(container.querySelectorAll('.nq-roadmap-edge')).toHaveLength(1);
    expect(container.querySelector('.nq-roadmap-frontier')?.getAttribute('aria-label')).toContain(
      'まだ 見えない',
    );
    expect(container.querySelector('.nq-roadmap-frontier')?.getAttribute('aria-label')).not.toContain(
      'かけ算',
    );
  });

  it('学年とおすすめ時期で単元を絞り込める', async () => {
    const container = await showRoadmap(vi.fn());

    await act(async () => {
      container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-subject')[1]!.click();
      container.querySelector<HTMLButtonElement>('[data-grade="1"]')!.click();
      container.querySelector<HTMLButtonElement>('[data-term="1"]')!.click();
    });

    expect(container.textContent).toContain('10までのかず');
    expect(container.textContent).not.toContain('かけ算');
    expect(container.textContent).not.toContain('じき未設定');
    expect(container.querySelector('[data-grade="1"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-term="1"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('補助教材をおまけと表示し、必修の全体進捗には含めない', async () => {
    const container = await showRoadmap(vi.fn());

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-grade="1"]')!.click();
      container.querySelector<HTMLButtonElement>('[data-term="1"]')!.click();
    });

    expect(container.textContent).toContain('おまけ');
    expect(container.querySelector('.nq-roadmap-score')?.textContent).toContain('0/1');
  });
});
