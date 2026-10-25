import { createEffectScope, type EffectScope } from '../../core/lifecycle/effectScope';

export interface FieldFlowHooks {
  lockInput(reason: string): void;
  releaseInput(reason: string): void;
  cleanupTransientUi(): void;
  reportError(error: unknown, reason: string): void;
}

export interface FieldFlowContext {
  readonly signal: AbortSignal;
  readonly scope: EffectScope;
  throwIfCancelled(): void;
}

export interface FieldFlowRuntime {
  readonly activeReason: string | null;
  readonly isRunning: boolean;
  run<T>(reason: string, action: (context: FieldFlowContext) => Promise<T>): Promise<T | undefined>;
  cancel(reason?: unknown): void;
}

interface ActiveFlow {
  readonly reason: string;
  readonly scope: EffectScope;
  finished: boolean;
}

export function createFieldFlowRuntime(hooks: FieldFlowHooks, parentScope?: EffectScope): FieldFlowRuntime {
  let active: ActiveFlow | null = null;

  const finish = (flow: ActiveFlow): void => {
    if (flow.finished) return;
    flow.finished = true;
    try {
      flow.scope.dispose('flow-finished');
    } finally {
      try {
        hooks.releaseInput(flow.reason);
      } finally {
        if (active === flow) active = null;
      }
    }
  };

  return {
    get activeReason() {
      return active?.reason ?? null;
    },
    get isRunning() {
      return active !== null;
    },
    async run<T>(reason: string, action: (context: FieldFlowContext) => Promise<T>): Promise<T | undefined> {
      if (active) return undefined;
      const scope = createEffectScope({
        signal: parentScope?.signal,
        onCleanupError: (error) => hooks.reportError(error, reason),
      });
      if (scope.disposed) return undefined;
      scope.register(hooks.cleanupTransientUi);
      const flow: ActiveFlow = { reason, scope, finished: false };
      active = flow;
      try {
        hooks.lockInput(reason);
        const context: FieldFlowContext = {
          signal: scope.signal,
          scope,
          throwIfCancelled: () => scope.signal.throwIfAborted(),
        };
        let rejectCancelled!: () => void;
        const cancelled = new Promise<never>((_resolve, reject) => {
          rejectCancelled = () => reject(scope.signal.reason);
          if (scope.signal.aborted) rejectCancelled();
          else scope.signal.addEventListener('abort', rejectCancelled, { once: true });
        });
        try {
          return await Promise.race([action(context), cancelled]);
        } finally {
          scope.signal.removeEventListener('abort', rejectCancelled);
        }
      } catch (error) {
        if (!scope.signal.aborted) hooks.reportError(error, reason);
        return undefined;
      } finally {
        finish(flow);
      }
    },
    cancel(reason?: unknown) {
      if (!active) return;
      const flow = active;
      flow.scope.dispose(reason);
      finish(flow);
    },
  };
}
