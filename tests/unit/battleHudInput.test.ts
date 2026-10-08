import { describe, expect, it, vi } from 'vitest';
import { pickBattleHudOption } from '../../src/ui/battle/useBattleHudInput';

describe('バトルHUDの選択', () => {
  it('使えないコマンドでも案内用の処理は呼ぶ', () => {
    const action = vi.fn();
    const onDisabled = vi.fn();

    pickBattleHudOption({ disabled: true, action, onDisabled });

    expect(action).not.toHaveBeenCalled();
    expect(onDisabled).toHaveBeenCalledOnce();
  });

  it('使えるコマンドでは通常の処理だけを呼ぶ', () => {
    const action = vi.fn();
    const onDisabled = vi.fn();

    pickBattleHudOption({ disabled: false, action, onDisabled });

    expect(action).toHaveBeenCalledOnce();
    expect(onDisabled).not.toHaveBeenCalled();
  });
});
