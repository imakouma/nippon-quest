import { describe, expect, it, vi } from 'vitest';
import { HudStore } from '../../src/ui/battle/store';

describe('HudStore selector subscription', () => {
  it('notifies only when the selected value changes', () => {
    const store = new HudStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeSelector((state) => state.cursor, listener);

    store.set({ menu: 'commands' });
    store.set({ message: { id: 1, text: '一時メッセージ', mode: 'log' } });
    expect(listener).not.toHaveBeenCalled();

    store.set({ cursor: 1 });
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenLastCalledWith(1);

    store.set({ cursor: 1 });
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    store.set({ cursor: 2 });
    expect(listener).toHaveBeenCalledOnce();
  });
});
