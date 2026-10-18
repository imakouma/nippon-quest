// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import type { InterPrefectureTravelPresentation } from '../../src/scenes/overworld/interPrefectureTravelPresentation';
import { InterPrefectureTravelOverlay } from '../../src/ui/field/InterPrefectureTravelOverlay';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

beforeAll(() => {
  setDictionary(JSON.parse(readFileSync('content/i18n/ja.json', 'utf8')) as I18nDict);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  render(null, document.body);
  document.body.replaceChildren();
});

const presentation: InterPrefectureTravelPresentation = {
  icon: 'travel-tunnel-rail',
  title: '列車[れっしゃ]で トンネルを すすむ',
  infrastructureLabel: 'トンネル',
  travelModeLabel: '列車[れっしゃ]',
  routeLabel: '北海道新幹線[ほっかいどうしんかんせん]・青函[せいかん]トンネル',
  departureLabel: '新青森駅[しんあおもりえき]',
  destinationLabel: '新函館北斗駅[しんはこだてほくとえき]',
  confirm:
    '北海道新幹線[ほっかいどうしんかんせん]・青函[せいかん]トンネルで 新函館北斗駅[しんはこだてほくとえき]へ 行[い]きますか？',
  depart: '新青森駅[しんあおもりえき]から 列車[れっしゃ]で 出発[しゅっぱつ]！',
  arrive: '新函館北斗駅[しんはこだてほくとえき]に 到着[とうちゃく]！',
  skip: '移動[いどう]を スキップ',
};

async function mount(overrides: Partial<Parameters<typeof InterPrefectureTravelOverlay>[0]> = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const onComplete = vi.fn();
  const onCancel = vi.fn();
  await act(async () => {
    render(
      h(InterPrefectureTravelOverlay, {
        presentation,
        durationMs: 1_200,
        onComplete,
        onCancel,
        ...overrides,
      }),
      container,
    );
  });
  return { container, onComplete, onCancel };
}

const key = (value: string) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));

describe('実在交通の移動オーバーレイ', () => {
  it('種類別アイコン、路線、出発地→到着地と確認操作を表示する', async () => {
    const { container } = await mount();
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!;

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.dataset.phase).toBe('confirm');
    expect(dialog.querySelector('h2')?.getAttribute('aria-label')).toBe('列車で トンネルを すすむ');
    expect(dialog.querySelector('.nq-travel-route')?.getAttribute('aria-label')).toBe(
      '北海道新幹線・青函トンネル',
    );
    expect(dialog.querySelector('.nq-travel-endpoints')?.getAttribute('aria-label')).toBe(
      '新青森駅 から 新函館北斗駅',
    );
    expect(dialog.querySelector('[data-travel-icon="travel-tunnel-rail"]')).not.toBeNull();
    expect([...dialog.querySelectorAll('button')].map((button) => button.textContent)).toEqual([
      'いいえ',
      'はい',
    ]);
  });

  it('決定キーで出発し、クリック・タッチ相当の操作で演出を一度だけスキップする', async () => {
    vi.useFakeTimers();
    const { container, onComplete, onCancel } = await mount();

    await act(async () => {
      key('Enter');
    });
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog.dataset.phase).toBe('moving');
    expect(dialog.querySelector('#nq-travel-status')?.getAttribute('aria-label')).toBe(
      '新青森駅から 列車で 出発！',
    );
    expect(dialog.querySelector('[role="progressbar"]')).not.toBeNull();

    await act(async () => {
      dialog.click();
      dialog.querySelector<HTMLButtonElement>('.nq-travel-skip')?.click();
      key('Escape');
      vi.runAllTimers();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('確認中はEscapeで戻り、完了コールバックと競合しない', async () => {
    vi.useFakeTimers();
    const { container, onComplete, onCancel } = await mount();

    await act(async () => {
      key('Escape');
      key('Escape');
      container.querySelector<HTMLButtonElement>('.nq-travel-confirm')?.click();
      vi.runAllTimers();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('自動演出は到着を表示してから一度だけ終了する', async () => {
    vi.useFakeTimers();
    const { container, onComplete } = await mount({ durationMs: 1_000 });

    await act(async () => container.querySelector<HTMLButtonElement>('.nq-travel-confirm')!.click());
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(container.querySelector<HTMLElement>('[role="dialog"]')?.dataset.phase).toBe('arrived');
    expect(container.querySelector('#nq-travel-status')?.getAttribute('aria-label')).toBe(
      '新函館北斗駅に 到着！',
    );
    await act(async () => {
      vi.runAllTimers();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('動きを減らす設定では長い演出を待たず、CSSもアニメーションを止める', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    const { container, onComplete } = await mount({ durationMs: 10_000 });

    await act(async () => container.querySelector<HTMLButtonElement>('.nq-travel-confirm')!.click());
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(container.querySelector<HTMLElement>('[role="dialog"]')?.dataset.phase).toBe('arrived');
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(readFileSync('src/ui/field/interPrefectureTravel.css', 'utf8')).toContain(
      '@media (prefers-reduced-motion: reduce)',
    );
  });
});
