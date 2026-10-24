export interface FieldFlowHooks {
  lockInput(reason: string): void;
  releaseInput(reason: string): void;
  cleanupTransientUi(): void;
  reportError(error: unknown, reason: string): void;
}

export interface FieldFlowContext {
  readonly signal: AbortSignal;
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
  readonly controller: AbortController;
  finished: boolean;
}

export function createFieldFlowRuntime(hooks: FieldFlowHooks): FieldFlowRuntime {
  let active: ActiveFlow | null = null;

  const finish = (flow: ActiveFlow): void => {
    if (flow.finished) return;
    flow.finished = true;
    try {
      hooks.cleanupTransientUi();
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
      const flow: ActiveFlow = { reason, controller: new AbortController(), finished: false };
      active = flow;
      try {
        hooks.lockInput(reason);
        return await action({
          signal: flow.controller.signal,
          throwIfCancelled: () => flow.controller.signal.throwIfAborted(),
        });
      } catch (error) {
        if (!flow.controller.signal.aborted) hooks.reportError(error, reason);
        return undefined;
      } finally {
        finish(flow);
      }
    },
    cancel(reason?: unknown) {
      if (!active) return;
      const flow = active;
      flow.controller.abort(reason);
      finish(flow);
    },
  };
}
