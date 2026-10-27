import { describe, expect, it } from 'vitest';
import { resolveCharacterBodySize } from '../../src/core/content/characterBodySizes';
import { findBrokenReferences } from '../../src/core/content/loader';
import { content } from './helpers';

describe('キャラクター固有の身体寸法', () => {
  it('資料室で設定済みの全モンスター寸法を読み込む', async () => {
    const c = await content();

    expect(Object.keys(c.characterBodySizes.characters)).toHaveLength(541);
    expect(resolveCharacterBodySize(c.characterBodySizes, 'yamanashi-suzurin')?.heightCm).toBe(32);
    expect(resolveCharacterBodySize(c.characterBodySizes, 'yamanashi-suzuri-tatsujin')?.heightCm).toBe(120);
    expect(resolveCharacterBodySize(c.characterBodySizes, 'yamanashi-boss-suisho-ryu')?.heightCm).toBe(350);
  });

  it('互換用の甲信越ボスだけは同じ採用画像の寸法を明示的に参照する', async () => {
    const c = await content();

    expect(c.characterBodySizes.aliases).toEqual({ 'koshinetsu-boss': 'tohoku-boss-rokufuyu' });
    expect(resolveCharacterBodySize(c.characterBodySizes, 'koshinetsu-boss')?.heightCm).toBe(480);
    expect(resolveCharacterBodySize(c.characterBodySizes, 'unknown-monster')).toBeUndefined();
  });

  it('寸法が欠けた敵と参照切れの互換IDを検出する', async () => {
    const c = await content();
    const characterBodySizes = structuredClone(c.characterBodySizes);
    delete characterBodySizes.characters['yamanashi-suzurin'];
    characterBodySizes.aliases['koshinetsu-boss'] = 'missing-body-size';

    const errors = findBrokenReferences({ ...c, characterBodySizes });

    expect(errors).toContain('characterBodySizes: monster "yamanashi-suzurin" の寸法がありません');
    expect(errors).toContain(
      'characterBodySizes: alias "koshinetsu-boss" の参照先 "missing-body-size" がありません',
    );
  });
});
