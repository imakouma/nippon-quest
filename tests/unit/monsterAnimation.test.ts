import { describe, expect, it } from 'vitest';
import { monsterAnimationSpec } from '../../src/rendering/monsterAnimation';

describe('モンスターのコマ差分', () => {
  it('リンゴロンだけに透過8コマを割り当てる', () => {
    const spec = monsterAnimationSpec('aomori-ringoron');
    expect(spec?.frameWidth).toBe(128);
    expect(spec?.frameHeight).toBe(128);
    expect(spec?.idle).toEqual([0, 1, 0, 3, 0, 2, 0]);
    expect(spec?.attack).toEqual([4, 5, 6, 7, 0]);
    expect(spec?.path).toBe('sprites/animations/aomori-ringoron-v1.png');
  });

  it('未登録IDは既存の絵を保つ', () => {
    expect(monsterAnimationSpec('not-in-game-character')).toBeUndefined();
    expect(monsterAnimationSpec('unreleased-form-id')).toBeUndefined();
  });
});
