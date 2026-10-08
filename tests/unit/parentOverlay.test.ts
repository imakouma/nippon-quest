// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { createNewGame } from '../../src/core/state/newGame';
import { ParentOverlay } from '../../src/ui/field/ParentOverlay';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

vi.mock('../../src/ui/sfx', () => ({ playSfx: vi.fn() }));

beforeAll(() => {
  const dictionary = JSON.parse(readFileSync('content/i18n/ja.json', 'utf8')) as I18nDict;
  setDictionary(dictionary);
});

afterEach(() => {
  vi.restoreAllMocks();
  render(null, document.body);
  document.body.replaceChildren();
});

async function unlock(container: HTMLElement): Promise<void> {
  const answer = container.querySelector<HTMLInputElement>('.nq-parent-gate input')!;
  await act(async () => {
    answer.value = '12';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => {
    container
      .querySelector<HTMLFormElement>('.nq-parent-gate')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

describe('保護者設定の更新日時', () => {
  it('メニューを開いた後のプレイ時間を保ったまま設定を変更する', async () => {
    const opened = createNewGame({ name: 'ハル', grade: 3 }, 0);
    const latest = structuredClone(opened);
    latest.learning.playSecondsByDate['2026-10-08'] = 60;
    let changed = opened;
    const container = document.createElement('div');
    document.body.append(container);
    render(
      h(ParentOverlay, {
        game: opened,
        getGame: () => latest,
        mastery: [],
        onChange: (next) => (changed = next),
        onImport: vi.fn(),
        onClose: vi.fn(),
      }),
      container,
    );
    await unlock(container);

    const grade = container.querySelector<HTMLSelectElement>('.nq-parent-grid select')!;
    grade.value = '4';
    grade.dispatchEvent(new Event('change', { bubbles: true }));

    expect(changed.learning.grade).toBe(4);
    expect(changed.learning.playSecondsByDate['2026-10-08']).toBe(60);
  });

  it('学習範囲を変更した時刻を GameState に記録する', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(5_000);
    const game = createNewGame({ name: 'ハル', grade: 3 }, 0);
    let changed = game;
    const container = document.createElement('div');
    document.body.append(container);
    render(
      h(ParentOverlay, {
        game,
        mastery: [],
        onChange: (next) => (changed = next),
        onImport: vi.fn(),
        onClose: vi.fn(),
      }),
      container,
    );
    await unlock(container);

    const grade = container.querySelector<HTMLSelectElement>('.nq-parent-grid select')!;
    grade.value = '4';
    grade.dispatchEvent(new Event('change', { bubbles: true }));

    expect(changed.learning.grade).toBe(4);
    expect(changed.updatedAt).toBe(5_000);
  });

  it('音量を変更した時刻を GameState に記録する', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(6_000);
    const game = createNewGame({ name: 'ハル', grade: 3 }, 0);
    let changed = game;
    const container = document.createElement('div');
    document.body.append(container);
    render(
      h(ParentOverlay, {
        game,
        mastery: [],
        onChange: (next) => (changed = next),
        onImport: vi.fn(),
        onClose: vi.fn(),
      }),
      container,
    );
    await unlock(container);

    const bgm = container.querySelector<HTMLInputElement>('.nq-parent-sliders input[type="range"]')!;
    bgm.value = '0.4';
    bgm.dispatchEvent(new Event('input', { bubbles: true }));

    expect(changed.settings.bgmVolume).toBe(0.4);
    expect(changed.updatedAt).toBe(6_000);
  });
});
