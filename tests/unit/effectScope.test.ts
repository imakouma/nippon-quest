import { describe, expect, it, vi } from 'vitest';
import { createEffectScope } from '../../src/core/lifecycle/effectScope';

describe('effect scope', () => {
  it('aborts first and disposes owned resources once in reverse order', () => {
    const scope = createEffectScope();
    const order: string[] = [];
    scope.register(() => order.push(`first:${scope.signal.aborted}`));
    scope.register(() => order.push(`second:${scope.signal.aborted}`));

    scope.dispose('complete');
    scope.dispose('again');

    expect(order).toEqual(['second:true', 'first:true']);
    expect(scope.disposed).toBe(true);
    expect(scope.signal.aborted).toBe(true);
    expect(scope.signal.reason).toBe('complete');
  });

  it('cleans up a resource registered after disposal immediately', () => {
    const scope = createEffectScope();
    const cleanup = vi.fn();
    scope.dispose();

    const unregister = scope.register(cleanup);
    unregister();

    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('can unregister a resource that completed before the scope', () => {
    const scope = createEffectScope();
    const cleanup = vi.fn();

    const unregister = scope.register(cleanup);
    unregister();
    scope.dispose();

    expect(cleanup).not.toHaveBeenCalled();
  });

  it('disposes child scopes when the parent is disposed', () => {
    const parent = createEffectScope();
    const child = parent.child();
    const cleanup = vi.fn();
    child.register(cleanup);

    parent.dispose('scene-shutdown');

    expect(cleanup).toHaveBeenCalledOnce();
    expect(child.signal.aborted).toBe(true);
    expect(child.signal.reason).toBe('scene-shutdown');
  });

  it('disposes from an external AbortSignal', () => {
    const controller = new AbortController();
    const scope = createEffectScope({ signal: controller.signal });
    const cleanup = vi.fn();
    scope.register(cleanup);

    controller.abort('cancelled');

    expect(cleanup).toHaveBeenCalledOnce();
    expect(scope.disposed).toBe(true);
    expect(scope.signal.reason).toBe('cancelled');
  });

  it('neutralizes guarded callbacks after disposal', () => {
    const scope = createEffectScope();
    const callback = vi.fn((value: number) => value * 2);
    const guarded = scope.guard(callback);

    expect(guarded(3)).toBe(6);
    scope.dispose();
    expect(guarded(4)).toBeUndefined();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('reports cleanup failures and continues disposing the remaining resources', () => {
    const onCleanupError = vi.fn();
    const scope = createEffectScope({ onCleanupError });
    const remaining = vi.fn();
    const error = new Error('destroy failed');
    scope.register(remaining);
    scope.register(() => {
      throw error;
    });

    expect(() => scope.dispose()).not.toThrow();

    expect(onCleanupError).toHaveBeenCalledWith(error);
    expect(remaining).toHaveBeenCalledOnce();
  });
});
