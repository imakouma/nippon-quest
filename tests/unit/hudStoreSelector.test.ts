import { describe, expect, it, vi } from 'vitest';
import { HudStore } from '../../src/ui/battle/store';

describe('HudStore selector subscription', () => {
  it('notifies only when the selected reference changes', () => {
    const store = new HudStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeSelector((state) => state.history, listener);

    store.set({ cursor: 1 });
    store.set({ message: { id: 1, text: '一時メッセージ', mode: 'log' } });
    expect(listener).not.toHaveBeenCalled();

    const history = {
      recent: [{ eventIndex: 1, lines: ['こうげき！'] }],
      timeline: [],
      totalPresentedEvents: 1,
      omittedTimelineEvents: 0,
    };
    store.set({ history });
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenLastCalledWith(history);

    store.set({ history });
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    store.set({ history: { ...history } });
    expect(listener).toHaveBeenCalledOnce();
  });
});
