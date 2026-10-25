export type EffectCleanup = () => void;

export interface EffectScopeOptions {
  signal?: AbortSignal;
  onCleanupError?: (error: unknown) => void;
}

export interface EffectScope {
  readonly signal: AbortSignal;
  readonly disposed: boolean;
  register(cleanup: EffectCleanup): () => void;
  child(): EffectScope;
  guard<TArgs extends unknown[], TResult>(
    callback: (...args: TArgs) => TResult,
  ): (...args: TArgs) => TResult | undefined;
  dispose(reason?: unknown): void;
}

interface CleanupEntry {
  active: boolean;
  cleanup: EffectCleanup;
}

const noop = (): void => undefined;

/** PhaserやDOMを知らず、一時的な副作用の所有権だけを管理する。 */
export function createEffectScope(options: EffectScopeOptions = {}): EffectScope {
  const controller = new AbortController();
  const entries: CleanupEntry[] = [];
  let disposed = false;
  let removeExternalAbort = noop;

  const reportCleanupError = (error: unknown): void => {
    try {
      options.onCleanupError?.(error);
    } catch {
      // cleanup reporterの失敗で、残りの資源解放を止めない。
    }
  };

  const dispose = (reason?: unknown): void => {
    if (disposed) return;
    disposed = true;
    controller.abort(reason);
    removeExternalAbort();
    removeExternalAbort = noop;
    for (let index = entries.length - 1; index >= 0; index--) {
      const entry = entries[index]!;
      if (!entry.active) continue;
      entry.active = false;
      try {
        entry.cleanup();
      } catch (error) {
        reportCleanupError(error);
      }
    }
    entries.length = 0;
  };

  const scope: EffectScope = {
    get signal() {
      return controller.signal;
    },
    get disposed() {
      return disposed;
    },
    register(cleanup) {
      if (disposed) {
        try {
          cleanup();
        } catch (error) {
          reportCleanupError(error);
        }
        return noop;
      }
      const entry: CleanupEntry = { active: true, cleanup };
      entries.push(entry);
      return () => {
        entry.active = false;
      };
    },
    child() {
      return createEffectScope({ signal: controller.signal, onCleanupError: options.onCleanupError });
    },
    guard(callback) {
      return (...args) => (disposed ? undefined : callback(...args));
    },
    dispose,
  };

  if (options.signal) {
    const external = options.signal;
    const onAbort = () => dispose(external.reason);
    if (external.aborted) dispose(external.reason);
    else {
      external.addEventListener('abort', onAbort, { once: true });
      removeExternalAbort = () => external.removeEventListener('abort', onAbort);
    }
  }

  return scope;
}
