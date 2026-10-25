import { describe, expect, it, vi } from 'vitest';
import { createFieldFlowRuntime, type FieldFlowHooks } from '../../src/scenes/overworld/fieldFlowRuntime';

function hooks() {
  return {
    lockInput: vi.fn<(reason: string) => void>(),
    releaseInput: vi.fn<(reason: string) => void>(),
    cleanupTransientUi: vi.fn<() => void>(),
    reportError: vi.fn<(error: unknown, reason: string) => void>(),
  } satisfies FieldFlowHooks;
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('field flow runtime', () => {
  it('locks once, returns the action value, and always releases to idle', async () => {
    const effects = hooks();
    const runtime = createFieldFlowRuntime(effects);

    const result = await runtime.run('landmark', async (context) => {
      expect(context.signal.aborted).toBe(false);
      context.throwIfCancelled();
      expect(runtime.activeReason).toBe('landmark');
      expect(runtime.isRunning).toBe(true);
      return 42;
    });

    expect(result).toBe(42);
    expect(effects.lockInput).toHaveBeenCalledOnce();
    expect(effects.lockInput).toHaveBeenCalledWith('landmark');
    expect(effects.cleanupTransientUi).toHaveBeenCalledOnce();
    expect(effects.releaseInput).toHaveBeenCalledOnce();
    expect(effects.releaseInput).toHaveBeenCalledWith('landmark');
    expect(effects.reportError).not.toHaveBeenCalled();
    expect(runtime.activeReason).toBeNull();
    expect(runtime.isRunning).toBe(false);
  });

  it('rejects a second flow without starting its action', async () => {
    const effects = hooks();
    const runtime = createFieldFlowRuntime(effects);
    const gate = deferred<void>();
    const first = runtime.run('event', async () => gate.promise);
    const secondAction = vi.fn(async () => 'second');

    await expect(runtime.run('chest', secondAction)).resolves.toBeUndefined();
    expect(secondAction).not.toHaveBeenCalled();
    expect(effects.lockInput).toHaveBeenCalledTimes(1);

    gate.resolve();
    await first;
  });

  it('reports an action error, cleans up, and permits the next flow', async () => {
    const effects = hooks();
    const runtime = createFieldFlowRuntime(effects);
    const error = new Error('cutin failed');

    await expect(
      runtime.run('landmark', async () => {
        throw error;
      }),
    ).resolves.toBeUndefined();
    expect(effects.reportError).toHaveBeenCalledWith(error, 'landmark');
    expect(effects.cleanupTransientUi).toHaveBeenCalledOnce();
    expect(effects.releaseInput).toHaveBeenCalledOnce();

    await expect(runtime.run('chest', async () => 'ready')).resolves.toBe('ready');
    expect(effects.lockInput).toHaveBeenCalledTimes(2);
    expect(effects.releaseInput).toHaveBeenCalledTimes(2);
  });

  it('aborts and releases immediately when cancelled', async () => {
    const effects = hooks();
    const runtime = createFieldFlowRuntime(effects);
    let signal: AbortSignal | undefined;
    const running = runtime.run('event', async (context) => {
      signal = context.signal;
      await new Promise<void>((_resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(context.signal.reason), { once: true });
      });
    });

    runtime.cancel('scene-shutdown');

    expect(signal?.aborted).toBe(true);
    expect(signal?.reason).toBe('scene-shutdown');
    expect(effects.cleanupTransientUi).toHaveBeenCalledOnce();
    expect(effects.releaseInput).toHaveBeenCalledOnce();
    expect(runtime.isRunning).toBe(false);
    await expect(running).resolves.toBeUndefined();
    expect(effects.reportError).not.toHaveBeenCalled();
    await expect(runtime.run('landmark', async () => 'next')).resolves.toBe('next');
  });

  it('settles the run promise on cancellation even when the action ignores the signal', async () => {
    const runtime = createFieldFlowRuntime(hooks());
    const running = runtime.run('event', async () => new Promise<never>(() => undefined));

    runtime.cancel('scene-shutdown');

    const outcome = await Promise.race([
      running.then(() => 'settled'),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 20)),
    ]);
    expect(outcome).toBe('settled');
  });

  it('does not clean up twice when cancellation races action completion', async () => {
    const effects = hooks();
    const runtime = createFieldFlowRuntime(effects);
    const gate = deferred<void>();
    const running = runtime.run('event', async ({ throwIfCancelled }) => {
      await gate.promise;
      throwIfCancelled();
    });

    runtime.cancel();
    gate.resolve();
    await running;

    expect(effects.cleanupTransientUi).toHaveBeenCalledOnce();
    expect(effects.releaseInput).toHaveBeenCalledOnce();
    expect(effects.reportError).not.toHaveBeenCalled();
  });
});
