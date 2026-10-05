import { beforeEach, describe, expect, it } from 'vitest';
import { existingAssetUrl, setAssetCatalog } from '../../src/rendering/assetCatalog';

describe('画像カタログ', () => {
  beforeEach(() => setAssetCatalog({}, '/game'));

  it('存在する完成画像だけURLを返す', () => {
    setAssetCatalog({ files: ['items/apple.png', 'sprites/monsters/ringoron.png'] }, '/game/');
    expect(existingAssetUrl('items/apple.png')).toBe('/game/assets/items/apple.png');
    expect(existingAssetUrl('items/missing.png')).toBeUndefined();
  });

  it('不正なパスと壊れたカタログを無視する', () => {
    setAssetCatalog({ files: ['../secret.png', '/absolute.png', 1] });
    expect(existingAssetUrl('../secret.png')).toBeUndefined();
    expect(existingAssetUrl('/absolute.png')).toBeUndefined();
  });
});
