import { describe, expect, it } from 'vitest';
import {
  characterBodySizeSchema,
  characterBodySizes,
  findCharacterBodySizeReferenceErrors,
  resolveCharacterBodySize,
} from '../../src/core/content/characterBodySizes';
import { findBrokenReferences } from '../../src/core/content/loader';
import { content } from './helpers';

describe('キャラクター固有の身体寸法', () => {
  it('資料室で設定済みの全モンスター寸法を読み込む', async () => {
    expect(Object.keys(characterBodySizes.characters)).toHaveLength(541);
    expect(resolveCharacterBodySize('yamanashi-suzurin')?.heightCm).toBe(32);
    expect(resolveCharacterBodySize('yamanashi-suzuri-tatsujin')?.heightCm).toBe(120);
    expect(resolveCharacterBodySize('yamanashi-boss-suisho-ryu')?.heightCm).toBe(350);
  });

  it('表示計算を壊す非有限値や0以下を拒否する', () => {
    expect(characterBodySizeSchema.safeParse({ heightKind: 'height', heightCm: Infinity }).success).toBe(
      false,
    );
    expect(characterBodySizeSchema.safeParse({ heightKind: 'height', heightCm: 0 }).success).toBe(false);
  });

  it('互換用の甲信越ボスだけは同じ採用画像の寸法を明示的に参照する', async () => {
    expect(characterBodySizes.aliases).toEqual({ 'koshinetsu-boss': 'tohoku-boss-rokufuyu' });
    expect(resolveCharacterBodySize('koshinetsu-boss')?.heightCm).toBe(480);
    expect(resolveCharacterBodySize('unknown-monster')).toBeUndefined();
  });

  it('寸法が欠けた敵と参照切れの互換IDを検出する', async () => {
    const c = await content();
    const monsters = new Map(c.monsters);
    monsters.set('missing-monster', structuredClone(c.monsters.get('yamanashi-suzurin')!));
    const errors = findCharacterBodySizeReferenceErrors(monsters);

    expect(errors).toContain('characterBodySizes: monster "missing-monster" の寸法がありません');
    expect(findBrokenReferences(c)).toEqual([]);
  });
});
