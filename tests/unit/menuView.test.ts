import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { chooseStoryCompanion } from '../../src/core/progression/storyCompanion';
import { barberRows, buildMenuView, menuTabs } from '../../src/scenes/overworld/menuEntries';
import { shopItemLines } from '../../src/scenes/overworld/townMenuViews';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';
import { content } from './helpers';

const game = () => chooseStoryCompanion(createNewGame({ name: 'ハル', grade: 3 }, 1_000), 'iwate-kagurabi');

beforeAll(() => {
  const dictionary = JSON.parse(
    readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8'),
  ) as I18nDict;
  setDictionary(dictionary);
});

describe('フィールドメニューの表示モデル', () => {
  it('店の武器には購入前に装備部位と性能を表示する', async () => {
    const c = await content();
    const weapon = c.items.get('common-dou-no-ken')!;
    const lines = shopItemLines(weapon, 0, true).join(' ');
    expect(lines).toContain('ぶき');
    expect(lines).toMatch(/こうげき\+\d+/);
    expect(lines).toContain('もっている：0こ');
  });

  it('バッグをフィールドメニューの入口として表示する', () => {
    expect(menuTabs(0).map((entry) => entry.key)).toContain('party');
    expect(menuTabs(0).map((entry) => entry.key)).not.toContain('look');
  });

  it('仲間のモンスターだけを発見済みとして図鑑へ出す', async () => {
    const c = await content();
    const view = buildMenuView({
      content: c,
      game: game(),
      tab: 'monsters',
      stats: { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 },
      revealAll: false,
      heroArt: () => 'hero',
      monsterArt: (monster) => `monster:${monster.id}`,
    });
    expect(view.entries.find((entry) => entry.key === 'iwate-kagurabi')).toMatchObject({
      known: true,
      art: 'monster:iwate-kagurabi',
    });
    expect(view.entries.some((entry) => !entry.known)).toBe(true);
    expect(new Set(view.entries.map((entry) => entry.group))).toEqual(
      new Set(['hokkaido', 'tohoku', 'kanto', 'chubu', 'kinki', 'chugoku', 'shikoku', 'kyushu-okinawa']),
    );
    expect(view.entries.find((entry) => entry.key === 'iwate-kagurabi')).toMatchObject({ group: 'tohoku' });
  });

  it('図鑑にバッグ内で使うマスの形を渡す', async () => {
    const c = await content();
    const view = buildMenuView({
      content: c,
      game: game(),
      tab: 'monsters',
      stats: { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 },
      revealAll: true,
      heroArt: () => 'hero',
      monsterArt: (monster) => `monster:${monster.id}`,
    });
    expect(view.entries.find((entry) => entry.key === 'aomori-nebutan')?.bagSize).toEqual({ w: 1, h: 1 });
    expect(view.entries.find((entry) => entry.key === 'aomori-nebuta-musha')?.bagSize).toEqual({
      w: 2,
      h: 1,
    });
    expect(view.entries.find((entry) => entry.key === 'aomori-nebuta-taisho')?.bagSize).toEqual({
      w: 3,
      h: 1,
    });
    expect(view.entries.find((entry) => entry.key === 'tohoku-boss-rokufuyu')?.bagSize).toEqual({
      w: 2,
      h: 2,
    });
  });

  it('床屋を5部位の有料選択肢へ変換する', () => {
    const rows = barberRows(game(), (look) => `${look.hair}-${look.skin}-${look.cloth}`, 30);
    expect(rows).toHaveLength(32);
    expect(rows.filter((entry) => entry.tag)).toHaveLength(5);
    expect(rows.filter((entry) => entry.action?.ok).length).toBeGreaterThan(0);
  });
});
