import type {
  EventCondition,
  EventLocalResult,
  EventRuntimeOptions,
  EventRuntimePorts,
  EventRuntimeResult,
  FieldEventCommand,
} from './contracts';

export const EVENT_BRANCH_DEPTH_LIMIT = 8;
export const EVENT_STEP_LIMIT = 128;

export type EventRuntimeErrorCode =
  | 'BRANCH_DEPTH_LIMIT'
  | 'DUPLICATE_KEY'
  | 'INVALID_COMMAND'
  | 'INVALID_PORT_RESULT'
  | 'LOCAL_RESULT_TYPE'
  | 'STEP_LIMIT'
  | 'UNKNOWN_LOCAL_KEY';

export class EventRuntimeError extends Error {
  constructor(
    public readonly code: EventRuntimeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'EventRuntimeError';
  }
}

interface RuntimeState {
  executedSteps: number;
  readonly flags: Set<string>;
  readonly locals: Map<string, EventLocalResult>;
}

function localResult<T extends EventLocalResult['type']>(
  state: RuntimeState,
  key: string,
  type: T,
): Extract<EventLocalResult, { type: T }> {
  const result = state.locals.get(key);
  if (!result) throw new EventRuntimeError('UNKNOWN_LOCAL_KEY', `event local key "${key}" is not defined`);
  if (result.type !== type)
    throw new EventRuntimeError(
      'LOCAL_RESULT_TYPE',
      `event local key "${key}" contains ${result.type}, expected ${type}`,
    );
  return result as Extract<EventLocalResult, { type: T }>;
}

function setLocal(state: RuntimeState, key: string, result: EventLocalResult): void {
  if (state.locals.has(key))
    throw new EventRuntimeError('DUPLICATE_KEY', `event local key "${key}" is already defined`);
  state.locals.set(key, result);
}

function conditionMatches(condition: EventCondition, state: RuntimeState): boolean {
  switch (condition.type) {
    case 'selection':
      return localResult(state, condition.key, 'selection').value === condition.equals;
    case 'score': {
      const score = localResult(state, condition.key, 'score').value;
      return score >= condition.min && (condition.max === undefined || score <= condition.max);
    }
    case 'battle':
      return localResult(state, condition.key, 'battle').value === condition.outcome;
    case 'flag':
      return state.flags.has(condition.flag) === (condition.isSet ?? true);
  }
}

function invalidPortResult(message: string): never {
  throw new EventRuntimeError('INVALID_PORT_RESULT', message);
}

async function executeList(
  commands: readonly FieldEventCommand[],
  ports: EventRuntimePorts,
  options: EventRuntimeOptions,
  state: RuntimeState,
  branchDepth: number,
): Promise<void> {
  for (const command of commands) {
    options.signal.throwIfAborted();
    if (state.executedSteps >= EVENT_STEP_LIMIT)
      throw new EventRuntimeError('STEP_LIMIT', `event exceeded the ${EVENT_STEP_LIMIT} step limit`);

    switch (command.type) {
      case 'dialogue':
        await ports.dialogue(command.lines);
        break;
      case 'selection': {
        const choice = await ports.choose(command.lines, command.choices);
        if (!Number.isInteger(choice) || choice < 0 || choice >= command.choices.length)
          invalidPortResult(`choice port returned invalid index ${choice}`);
        setLocal(state, command.key, { type: 'selection', value: choice });
        break;
      }
      case 'question': {
        const score = await ports.question(command.request);
        if (!Number.isFinite(score) || score < 0 || score > 1)
          invalidPortResult(`question port returned invalid score ${score}`);
        setLocal(state, command.key, { type: 'score', value: score });
        break;
      }
      case 'reward': {
        const score = localResult(state, command.scoreKey, 'score').value;
        await ports.reward(command.table, score);
        break;
      }
      case 'set-flag':
        ports.setFlag(command.flag);
        state.flags.add(command.flag);
        break;
      case 'battle': {
        const outcome = await ports.battle(command);
        if (outcome !== 'victory' && outcome !== 'defeat')
          invalidPortResult(`battle port returned invalid outcome ${String(outcome)}`);
        setLocal(state, command.key, { type: 'battle', value: outcome });
        break;
      }
      case 'warp':
        await ports.warp(command);
        break;
      case 'branch': {
        if (branchDepth >= EVENT_BRANCH_DEPTH_LIMIT)
          throw new EventRuntimeError(
            'BRANCH_DEPTH_LIMIT',
            `event exceeded the ${EVENT_BRANCH_DEPTH_LIMIT} branch depth limit`,
          );
        const next = conditionMatches(command.condition, state) ? command.then : command.else;
        state.executedSteps += 1;
        if (next) await executeList(next, ports, options, state, branchDepth + 1);
        continue;
      }
      default:
        throw new EventRuntimeError(
          'INVALID_COMMAND',
          `unknown event command ${String((command as { type?: unknown }).type)}`,
        );
    }
    state.executedSteps += 1;
  }
}

export async function executeEventCommands(
  commands: readonly FieldEventCommand[],
  ports: EventRuntimePorts,
  options: EventRuntimeOptions,
): Promise<EventRuntimeResult> {
  const state: RuntimeState = {
    executedSteps: 0,
    flags: new Set(options.flags),
    locals: new Map(),
  };
  await executeList(commands, ports, options, state, 0);
  return {
    executedSteps: state.executedSteps,
    flags: new Set(state.flags),
    locals: new Map(state.locals),
  };
}
