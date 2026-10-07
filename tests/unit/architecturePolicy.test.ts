import { describe, expect, it } from 'vitest';
import { sourceBudget } from '../../scripts/architecture-policy';

describe('ソース行数ポリシー', () => {
  it('通常モジュールには共通上限を使う', () => {
    expect(sourceBudget('src/core/example.ts').maxLines).toBe(650);
    expect(sourceBudget('src/ui/example.tsx').maxLines).toBe(650);
  });

  it('描画定義と生成スクリプトだけ用途別上限を使う', () => {
    expect(sourceBudget('src/rendering/monsters/example.ts').maxLines).toBe(3000);
    expect(sourceBudget('scripts/example.ts').maxLines).toBe(2700);
  });

  it('既存の巨大Sceneは現在より増やせない', () => {
    expect(sourceBudget('src/scenes/Overworld.ts').maxLines).toBe(3490);
    expect(sourceBudget('src/scenes/Battle.ts').maxLines).toBe(1750);
  });
});
