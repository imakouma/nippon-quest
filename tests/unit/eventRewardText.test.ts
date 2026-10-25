import { beforeAll, describe, expect, it } from 'vitest';
import ja from '../../content/i18n/ja.json';
import {
  fieldRewardDialogue,
  fieldRewardText,
  type FieldRewardContent,
} from '../../src/scenes/overworld/eventRewardText';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

const content: FieldRewardContent = {
  items: new Map([
    ['item.apple', { name: 'りんご' }],
    ['item.helmet', { name: 'かぶと' }],
  ]),
  skills: new Map([['skill.fire', { name: 'ほのおのまい' }]]),
  recipes: new Map([['recipe.helmet', { result: { itemId: 'item.helmet' } }]]),
};

beforeAll(() => setDictionary(ja as I18nDict));

describe('fieldRewardText', () => {
  it('formats numeric rewards', () => {
    expect(fieldRewardText({ kind: 'xp', n: 12 }, content)).toBe('けいけんちを 12 もらった！');
    expect(fieldRewardText({ kind: 'gold', n: 30 }, content)).toBe('おかねを 30G もらった！');
  });

  it('resolves item, skill, and recipe names from content', () => {
    expect(fieldRewardText({ kind: 'item', id: 'item.apple', n: 2 }, content)).toBe(
      'りんごを 2こ てに いれた！',
    );
    expect(fieldRewardText({ kind: 'skill', id: 'skill.fire' }, content)).toContain('ほのおのまい');
    expect(fieldRewardText({ kind: 'recipe', id: 'recipe.helmet' }, content)).toContain('かぶと');
  });

  it('preserves fallback ids and fixed reward messages', () => {
    expect(fieldRewardText({ kind: 'item', id: 'missing', n: 1 }, content)).toContain('missing');
    expect(fieldRewardText({ kind: 'title', id: 'ものしり' }, content)).toContain('ものしり');
    expect(fieldRewardText({ kind: 'monster' }, content)).toBe(
      'どこかで あたらしい マナビモノが めを さました…！',
    );
  });

  it('builds dialogue lines with the shared reward speaker', () => {
    expect(fieldRewardDialogue([{ kind: 'gold', n: 30 }], content)).toEqual([
      { speaker: 'ごほうび', text: 'おかねを 30G もらった！' },
    ]);
  });
});
