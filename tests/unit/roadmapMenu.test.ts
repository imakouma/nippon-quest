// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import type { RoadmapNode } from '../../src/shared/menuModel';
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

function subjectButton(container: HTMLElement, subject: string): HTMLButtonElement {
  return container.querySelector<HTMLButtonElement>(`.nq-roadmap-subject[data-subject="${subject}"]`)!;
}

describe('学習ロードマップの単元選択', () => {
  it('全学年では教科を一文字で表示し、現在学んでいる学年も伝える', async () => {
    const container = await showRoadmap(vi.fn());
    const subjectButtons = [...container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-subject')];

    expect(subjectButtons.map((button) => button.dataset.subject)).toEqual([
      'all',
      'kokugo',
      'sansu',
      'rika',
      'shakai',
      'seikatsu',
      'eigo',
    ]);
    expect(
      subjectButtons.map((button) => button.querySelector('.nq-roadmap-subject-name')?.textContent),
    ).toEqual(['全', '国', '算', '理', '社', '生', '英']);
    expect(subjectButton(container, 'sansu').textContent).toContain('1年');
    expect(subjectButton(container, 'rika').textContent).toContain('3年');
    expect(subjectButton(container, 'sansu').getAttribute('aria-label')).toBe('算数・いまは 1年生');
    expect(subjectButtons.every((button) => button.title === button.getAttribute('aria-label'))).toBe(true);
  });

  it('1・2年生では国語・算数・生活科だけを全文で表示する', async () => {
    const container = await showRoadmap(vi.fn());
    const period = container.querySelector<HTMLInputElement>('.nq-roadmap-period-range')!;

    for (const value of ['1', '4']) {
      await act(async () => {
        period.value = value;
        period.dispatchEvent(new Event('input', { bubbles: true }));
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
      ).toEqual(['全', '国語', '算数', '生活科']);
      expect(
        subjectButtons.slice(1).every((button) => button.classList.contains('nq-roadmap-subject-long')),
      ).toBe(true);
      expect(
        container.querySelector('.nq-roadmap-subjects')?.classList.contains('nq-roadmap-subjects-lower'),
      ).toBe(true);
    }
  });

  it('3〜6年生では教科を一文字で表示する', async () => {
    const container = await showRoadmap(vi.fn());
    const period = container.querySelector<HTMLInputElement>('.nq-roadmap-period-range')!;

    await act(async () => {
      period.value = '7';
      period.dispatchEvent(new Event('input', { bubbles: true }));
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
    ).toEqual(['全', '国', '算', '理', '社']);
    expect(
      subjectButtons.slice(1).every((button) => button.classList.contains('nq-roadmap-subject-long')),
    ).toBe(false);
  });

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
      subjectButton(container, 'sansu').click();
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
      subjectButton(container, 'sansu').click();
    });
    const locked = container.querySelector<HTMLButtonElement>('.nq-roadmap-frontier');
    expect(locked?.disabled).toBe(false);
    expect(locked?.getAttribute('aria-disabled')).toBe('true');
    locked!.click();

    expect(onRoadmapSelect).not.toHaveBeenCalled();
    expect(locked!.textContent).not.toContain('かけ算');
    expect(locked!.textContent).toContain('？');
  });

  it('前提関係を接続線で描き、霧の向こうの単元名は読み上げない', async () => {
    const container = await showRoadmap(vi.fn());

    await act(async () => {
      subjectButton(container, 'sansu').click();
    });

    expect(container.querySelectorAll('.nq-roadmap-edge')).toHaveLength(1);
    expect(container.querySelector('line.nq-roadmap-edge')).not.toBeNull();
    expect(container.querySelector('path.nq-roadmap-edge')).toBeNull();
    expect(container.querySelector('.nq-roadmap-frontier')?.getAttribute('aria-label')).toContain(
      'まだ 見えない',
    );
    expect(container.querySelector('.nq-roadmap-frontier')?.getAttribute('aria-label')).not.toContain(
      'かけ算',
    );
  });

  it('学年とおすすめ時期を1本のバーで絞り込める', async () => {
    const container = await showRoadmap(vi.fn());
    const period = container.querySelector<HTMLInputElement>('.nq-roadmap-period-range')!;

    await act(async () => {
      subjectButton(container, 'sansu').click();
      period.value = '1';
      period.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(container.textContent).toContain('10までのかず');
    expect(container.textContent).not.toContain('かけ算');
    expect(container.textContent).toContain('じき未設定');
    expect(container.querySelector('.nq-roadmap-period-value')?.textContent).toContain('1ねん・1がっき');
    expect(container.querySelectorAll('.nq-roadmap-toolbar')).toHaveLength(1);
    expect(container.querySelector('.nq-roadmap-grade-row')).toBeNull();
    expect(container.querySelector('.nq-roadmap-term-row')).toBeNull();
  });

  it('1・2年生では補助教材を教科一覧と必修進捗に含めない', async () => {
    const container = await showRoadmap(vi.fn());
    const period = container.querySelector<HTMLInputElement>('.nq-roadmap-period-range')!;

    await act(async () => {
      period.value = '1';
      period.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(container.querySelector('.nq-roadmap-subject[data-subject="eigo"]')).toBeNull();
    expect(container.textContent).not.toContain('おまけ');
    expect(container.querySelector('.nq-roadmap-score')?.textContent).toContain('0/4');
  });

  it('地図をボタンとトラックパッド操作で拡大し、現在地へ100%で戻せる', async () => {
    const container = await showRoadmap(vi.fn());

    await act(async () => {
      subjectButton(container, 'sansu').click();
    });

    const zoomIn = container.querySelector<HTMLButtonElement>('.nq-roadmap-zoom-in')!;
    const reset = container.querySelector<HTMLButtonElement>('.nq-roadmap-reset')!;
    const value = () => container.querySelector('.nq-roadmap-zoom-value')?.textContent;

    expect(value()).toContain('100%');
    await act(async () => zoomIn.click());
    expect(value()).toContain('120%');
    await act(async () => reset.click());
    expect(value()).toContain('100%');

    const map = container.querySelector<HTMLElement>('.nq-roadmap-map')!;
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
    expect(value()).toContain('110%');

    const canvas = container.querySelector<HTMLElement>('.nq-roadmap-canvas')!;
    const beforePan = canvas.style.transform;
    await act(async () => {
      map.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 20, deltaY: 10 }));
    });
    expect(canvas.style.transform).not.toBe(beforePan);
  });

  it('非ロックの学習関係を点線で描き、未達の前提単元を表示する', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const base = { ...nodes[3]!, x: 72, y: 64 };
    const target: RoadmapNode = {
      ...nodes[5]!,
      id: 'sansu.g1.application',
      name: 'たしひきの おうよう',
      x: 252,
      y: 212,
      state: 'locked',
      visibility: 'revealed',
      prerequisiteIds: ['sansu.g1.hikizan'],
      supportingLinks: [{ sourceId: base.id, kind: 'transfer' }],
      blockedByNames: ['ひき算[ざん]'],
    };

    render(h(RoadmapGraph, { nodes: [base, target], onSelect: vi.fn() }), container);

    expect(container.querySelector('.nq-roadmap-edge-transfer')).not.toBeNull();
    expect(container.querySelector('.nq-roadmap-blocked-by')?.textContent).toContain('さきに：ひき算');
    expect(
      [...container.querySelectorAll<HTMLButtonElement>('.nq-roadmap-node')]
        .find((node) => node.textContent?.includes('たしひき'))
        ?.getAttribute('aria-label'),
    ).toContain('さきに：ひき算');
  });
});
