export type MapObjectDirection = 'down' | 'left' | 'right' | 'up';

export type MapObjectMovementCommand =
  | { type: 'walk'; direction: MapObjectDirection }
  | { type: 'face'; direction: MapObjectDirection }
  | { type: 'wait'; durationMs: number }
  | { type: 'emote'; emote: string }
  | { type: 'hide' }
  | { type: 'show' };

export type MapObjectMovementState =
  | { phase: 'INIT' }
  | { phase: 'WAITING_FOR_READY' }
  | { phase: 'STARTING_COMMAND'; index: number; command: MapObjectMovementCommand }
  | { phase: 'WAITING_FOR_COMPLETION'; index: number; command: MapObjectMovementCommand }
  | { phase: 'ADVANCING'; executedSteps: number }
  | { phase: 'FINISHED'; outcome: 'completed' | 'failed'; executedSteps: number };

export interface MapObjectMovementReservation {
  commit(): void;
  release(): void;
}

export interface MapObjectMovementPorts {
  prepare(objectId: string, signal: AbortSignal): Promise<void>;
  reserveStep(
    objectId: string,
    direction: MapObjectDirection,
    signal: AbortSignal,
  ): Promise<MapObjectMovementReservation | null>;
  walk(
    objectId: string,
    direction: MapObjectDirection,
    reservation: MapObjectMovementReservation,
    signal: AbortSignal,
  ): Promise<void>;
  face(objectId: string, direction: MapObjectDirection, signal: AbortSignal): Promise<void>;
  wait(durationMs: number, signal: AbortSignal): Promise<void>;
  emote(objectId: string, emote: string, signal: AbortSignal): Promise<void>;
  setVisible(objectId: string, visible: boolean, signal: AbortSignal): Promise<void>;
  cleanup(objectId: string, error?: unknown): void;
}

export interface MapObjectMovementOptions {
  signal: AbortSignal;
  maxSteps?: number;
  maxDurationMs?: number;
  onStateChange?(state: MapObjectMovementState): void;
}

export interface MapObjectMovementResult {
  executedSteps: number;
}

export const MAP_OBJECT_MOVEMENT_STEP_LIMIT = 64;
export const MAP_OBJECT_MOVEMENT_TIME_LIMIT_MS = 30_000;

export type MapObjectMovementErrorCode =
  'BLOCKED' | 'INVALID_COMMAND' | 'INVALID_OPTIONS' | 'STEP_LIMIT' | 'TIME_LIMIT';

export class MapObjectMovementError extends Error {
  constructor(
    public readonly code: MapObjectMovementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'MapObjectMovementError';
  }
}

function positiveLimit(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new MapObjectMovementError('INVALID_OPTIONS', `${name} must be a positive safe integer`);
  return value;
}

function releaseReservation(reservation: MapObjectMovementReservation | null): unknown {
  if (!reservation) return undefined;
  try {
    reservation.release();
    return undefined;
  } catch (error) {
    return error;
  }
}

function combineErrors(primary: unknown, cleanupErrors: unknown[]): unknown {
  if (primary !== undefined && cleanupErrors.length) {
    return new AggregateError([primary, ...cleanupErrors], 'map object movement and cleanup failed');
  }
  if (primary !== undefined) return primary;
  if (cleanupErrors.length === 1) return cleanupErrors[0];
  if (cleanupErrors.length > 1)
    return new AggregateError(cleanupErrors, 'map object movement cleanup failed');
  return undefined;
}

export async function runMapObjectMovement(
  objectId: string,
  commands: readonly MapObjectMovementCommand[],
  ports: MapObjectMovementPorts,
  options: MapObjectMovementOptions,
): Promise<MapObjectMovementResult> {
  let executedSteps = 0;
  let activeReservation: MapObjectMovementReservation | null = null;
  let failure: unknown;
  const controller = new AbortController();
  const emit = (state: MapObjectMovementState) => options.onStateChange?.(state);
  const maxSteps = options.maxSteps ?? MAP_OBJECT_MOVEMENT_STEP_LIMIT;
  const maxDurationMs = options.maxDurationMs ?? MAP_OBJECT_MOVEMENT_TIME_LIMIT_MS;
  const timeoutDelay =
    Number.isSafeInteger(maxDurationMs) && maxDurationMs > 0
      ? maxDurationMs
      : MAP_OBJECT_MOVEMENT_TIME_LIMIT_MS;
  const abortFromCaller = () => controller.abort(options.signal.reason);
  if (options.signal.aborted) abortFromCaller();
  else options.signal.addEventListener('abort', abortFromCaller, { once: true });

  const timeoutError = new MapObjectMovementError(
    'TIME_LIMIT',
    `map object movement exceeded ${maxDurationMs}ms`,
  );
  const timeout = globalThis.setTimeout(() => controller.abort(timeoutError), timeoutDelay);
  let rejectAbort!: (reason?: unknown) => void;
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectAbort = () => reject(controller.signal.reason);
    if (controller.signal.aborted) rejectAbort();
    else controller.signal.addEventListener('abort', rejectAbort, { once: true });
  });
  const bounded = <T>(operation: () => Promise<T>): Promise<T> => {
    controller.signal.throwIfAborted();
    return Promise.race([operation(), aborted]);
  };

  try {
    emit({ phase: 'INIT' });
    positiveLimit(maxSteps, 'maxSteps');
    positiveLimit(maxDurationMs, 'maxDurationMs');
    if (!objectId) throw new MapObjectMovementError('INVALID_OPTIONS', 'objectId must not be empty');
    if (commands.length > maxSteps)
      throw new MapObjectMovementError('STEP_LIMIT', `movement exceeded the ${maxSteps} step limit`);

    emit({ phase: 'WAITING_FOR_READY' });
    await bounded(() => ports.prepare(objectId, controller.signal));

    for (const [index, command] of commands.entries()) {
      controller.signal.throwIfAborted();
      emit({ phase: 'STARTING_COMMAND', index, command });

      if (command.type === 'walk') {
        activeReservation = await bounded(() =>
          ports.reserveStep(objectId, command.direction, controller.signal),
        );
        if (!activeReservation)
          throw new MapObjectMovementError(
            'BLOCKED',
            `movement for object "${objectId}" is blocked at step ${index}`,
          );
        emit({ phase: 'WAITING_FOR_COMPLETION', index, command });
        await bounded(() => ports.walk(objectId, command.direction, activeReservation!, controller.signal));
        activeReservation.commit();
        activeReservation = null;
      } else {
        emit({ phase: 'WAITING_FOR_COMPLETION', index, command });
        switch (command.type) {
          case 'face':
            await bounded(() => ports.face(objectId, command.direction, controller.signal));
            break;
          case 'wait':
            if (!Number.isFinite(command.durationMs) || command.durationMs < 0)
              throw new MapObjectMovementError(
                'INVALID_COMMAND',
                `wait duration must be a finite nonnegative number at step ${index}`,
              );
            await bounded(() => ports.wait(command.durationMs, controller.signal));
            break;
          case 'emote':
            if (!command.emote)
              throw new MapObjectMovementError('INVALID_COMMAND', `emote must not be empty at step ${index}`);
            await bounded(() => ports.emote(objectId, command.emote, controller.signal));
            break;
          case 'hide':
            await bounded(() => ports.setVisible(objectId, false, controller.signal));
            break;
          case 'show':
            await bounded(() => ports.setVisible(objectId, true, controller.signal));
            break;
          default:
            throw new MapObjectMovementError(
              'INVALID_COMMAND',
              `unknown movement command ${String((command as { type?: unknown }).type)}`,
            );
        }
      }

      executedSteps += 1;
      emit({ phase: 'ADVANCING', executedSteps });
    }
  } catch (error) {
    failure = error;
  } finally {
    globalThis.clearTimeout(timeout);
    options.signal.removeEventListener('abort', abortFromCaller);
    controller.signal.removeEventListener('abort', rejectAbort);
    const cleanupErrors: unknown[] = [];
    const releaseError = releaseReservation(activeReservation);
    if (releaseError !== undefined) cleanupErrors.push(releaseError);
    try {
      ports.cleanup(objectId, failure);
    } catch (error) {
      cleanupErrors.push(error);
    }
    failure = combineErrors(failure, cleanupErrors);
    emit({
      phase: 'FINISHED',
      outcome: failure === undefined ? 'completed' : 'failed',
      executedSteps,
    });
  }

  if (failure !== undefined) throw failure;
  return { executedSteps };
}
