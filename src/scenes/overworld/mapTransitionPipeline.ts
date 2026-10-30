export type MapTransitionReason = 'door' | 'warp' | 'world-map' | 'defeat' | 'script';

export interface MapTransitionRequest {
  targetMap: string;
  spawnName?: string;
  tile?: readonly [number, number];
  exactSpawn?: boolean;
  interPrefectureArrival?: boolean;
  reason: MapTransitionReason;
}

export interface MapTransitionPorts {
  closeTransientUi(): void;
  fadeOut(signal: AbortSignal): Promise<void>;
  restart(request: MapTransitionRequest): void;
}

export const MAP_TRANSITION_FADE_FALLBACK_MS = 600;

export async function runMapTransition(
  request: MapTransitionRequest,
  ports: MapTransitionPorts,
  signal: AbortSignal,
): Promise<void> {
  const captured = captureRequest(request);
  if (signal.aborted) return;

  ports.closeTransientUi();
  if (signal.aborted) return;

  await new Promise<void>((resolve, reject) => {
    let finished = false;
    const cleanup = () => {
      globalThis.clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
    };
    const settle = (finish: () => void) => {
      if (finished) return;
      finished = true;
      cleanup();
      finish();
    };
    const complete = (restart: boolean) =>
      settle(() => {
        try {
          if (restart) ports.restart(captured);
          resolve();
        } catch (restartError) {
          reject(restartError);
        }
      });
    const fail = (error: unknown) =>
      settle(() => {
        reject(error);
      });
    const onAbort = () => complete(false);

    signal.addEventListener('abort', onAbort, { once: true });
    const timeout = globalThis.setTimeout(() => complete(true), MAP_TRANSITION_FADE_FALLBACK_MS);
    try {
      void ports.fadeOut(signal).then(
        () => complete(true),
        (error: unknown) => fail(error),
      );
    } catch (error) {
      fail(error);
    }
  });
}

function captureRequest(request: MapTransitionRequest): MapTransitionRequest {
  return Object.freeze({
    targetMap: request.targetMap,
    reason: request.reason,
    ...(request.spawnName !== undefined ? { spawnName: request.spawnName } : {}),
    ...(request.tile !== undefined
      ? { tile: Object.freeze([request.tile[0], request.tile[1]] as const) }
      : {}),
    ...(request.exactSpawn !== undefined ? { exactSpawn: request.exactSpawn } : {}),
    ...(request.interPrefectureArrival !== undefined
      ? { interPrefectureArrival: request.interPrefectureArrival }
      : {}),
  });
}
