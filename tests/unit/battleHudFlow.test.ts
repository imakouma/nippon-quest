import { describe, expect, it, vi } from 'vitest';
import { BattleHudFlow } from '../../src/scenes/battle/hudFlow';
import { HudStore } from '../../src/ui/battle/store';

function setup() {
  const hud = new HudStore();
  const delays: Array<() => void> = [];
  const waits: Array<() => void> = [];
  const flow = new BattleHudFlow(
    hud,
    () => new Promise<void>((resolve) => waits.push(resolve)),
    (_ms, done) => delays.push(done),
  );
  return { hud, flow, delays, waits };
}

describe('BattleHudFlow', () => {
  it('表示したメッセージと同じIDの入力だけで待機を終える', async () => {
    const { hud, flow } = setup();
    const done = vi.fn();
    void flow.say('つぎへ', 'wait').then(done);
    const id = hud.get().message!.id;

    flow.receive({ t: 'advance', messageId: id + 1 });
    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();

    flow.receive({ t: 'advance', messageId: id });
    await Promise.resolve();
    expect(done).toHaveBeenCalledOnce();
  });

  it('条件に合う操作だけを返す', async () => {
    const { flow } = setup();
    const selected = flow.waitFor((action) => action.t === 'resultClose');
    flow.receive({ t: 'recruitAnswer', yes: true });
    flow.receive({ t: 'resultClose' });
    await expect(selected).resolves.toEqual({ t: 'resultClose' });
  });

  it('新しいバナーを古い待機完了で消さない', async () => {
    const { hud, flow, waits } = setup();
    const first = flow.showBanner('good', '1');
    const second = flow.showBanner('perfect', '2');
    waits[0]!();
    await first;
    expect(hud.get().banner?.text).toBe('2');
    waits[1]!();
    await second;
    expect(hud.get().banner).toBeNull();
  });

  it('ポップアップを時間経過後に個別に消す', () => {
    const { hud, flow, delays } = setup();
    flow.popup(10, 20, '-5', 'damage');
    flow.popup(30, 40, '+3', 'heal');
    expect(hud.get().popups).toHaveLength(2);
    delays[0]!();
    expect(hud.get().popups.map((popup) => popup.text)).toEqual(['+3']);
  });
});
