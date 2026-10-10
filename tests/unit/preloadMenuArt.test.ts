import { describe, expect, it, vi } from 'vitest';
import type { ContentIndex } from '../../src/core/content/loader';
import { deferMenuArtPreload } from '../../src/rendering/preloadMenuArt';

describe('図鑑画像のバックグラウンド読み込み', () => {
  it('起動処理中には実行せず、次のタスクへ遅延する', async () => {
    let scheduled: (() => void) | undefined;
    const onDone = vi.fn();
    const content = { monsters: new Map(), items: new Map() } as unknown as ContentIndex;

    deferMenuArtPreload(content, {
      schedule: (run) => {
        scheduled = run;
      },
      onDone,
    });

    expect(scheduled).toBeTypeOf('function');
    expect(onDone).not.toHaveBeenCalled();

    scheduled?.();
    await Promise.resolve();

    expect(onDone).toHaveBeenCalledOnce();
  });
});
