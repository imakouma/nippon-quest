import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { chooseStoryCompanion } from '../../src/core/progression/storyCompanion';
import { buildMenuView, menuTabs } from '../../src/scenes/overworld/menuEntries';
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
  it('バッグをフィールドメニューの入口として表示する', () => {
    expect(menuTabs(0).map((entry) => entry.key)).toContain('party');
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
  });

  it('見た目タブを5部位の表示データへ変換する', async () => {
    const c = await content();
    const view = buildMenuView({
      content: c,
      game: game(),
      tab: 'look',
      stats: { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 },
      revealAll: false,
      heroArt: (look) => `${look.hair}-${look.skin}-${look.cloth}`,
      monsterArt: () => '',
    });
    expect(view.entries).toHaveLength(32);
    expect(view.entries.filter((entry) => entry.tag)).toHaveLength(5);
  });
});
