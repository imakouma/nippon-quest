import type {
  EventCondition,
  EventLocalResult,
  EventReward,
  FieldEventCommand,
  ScriptedAreaEvent,
} from './contracts';
import { EVENT_BRANCH_DEPTH_LIMIT, EVENT_STEP_LIMIT } from './runtime';

export interface EventContentReferences {
  maps: ReadonlySet<string>;
  monsters: ReadonlySet<string>;
  items: ReadonlySet<string>;
  skills: ReadonlySet<string>;
  recipes: ReadonlySet<string>;
}

type EventLocalType = EventLocalResult['type'];

function validateReward(
  reward: EventReward,
  references: EventContentReferences,
  report: (message: string) => void,
): void {
  for (const item of reward.items ?? [])
    if (!references.items.has(item.itemId)) report(`reward item "${item.itemId}" が存在しません`);
  for (const skill of reward.skills ?? [])
    if (!references.skills.has(skill)) report(`reward skill "${skill}" が存在しません`);
  for (const recipe of reward.recipes ?? [])
    if (!references.recipes.has(recipe)) report(`reward recipe "${recipe}" が存在しません`);
  for (const monster of reward.unlockMonsters ?? [])
    if (!references.monsters.has(monster)) report(`reward unlockMonsters "${monster}" が存在しません`);
}

export function validateScriptedAreaEvent(
  event: ScriptedAreaEvent,
  references: EventContentReferences,
): string[] {
  const errors: string[] = [];
  const resultKeys = new Set<string>();
  let stepCount = 0;
  let maxBranchDepth = 0;
  const report = (message: string): void => {
    errors.push(`event "${event.id}": ${message}`);
  };

  const requireLocal = (
    key: string,
    expected: EventLocalType,
    locals: ReadonlyMap<string, EventLocalType>,
  ): void => {
    const actual = locals.get(key);
    if (!actual) report(`local key "${key}" が定義されていません`);
    else if (actual !== expected) report(`local key "${key}" は ${actual} ですが ${expected} が必要です`);
  };

  const validateCondition = (
    condition: EventCondition,
    locals: ReadonlyMap<string, EventLocalType>,
  ): void => {
    switch (condition.type) {
      case 'choice':
        requireLocal(condition.key, 'choice', locals);
        break;
      case 'score':
        requireLocal(condition.key, 'score', locals);
        if (condition.max !== undefined && condition.min > condition.max)
          report(`score 条件の min ${condition.min} は max ${condition.max} 以下にしてください`);
        break;
      case 'battle':
        requireLocal(condition.key, 'battle', locals);
        break;
      case 'flag':
        break;
    }
  };

  const defineLocal = (key: string, type: EventLocalType, locals: Map<string, EventLocalType>): void => {
    if (resultKeys.has(key)) {
      report(`local key "${key}" が重複しています`);
      return;
    }
    resultKeys.add(key);
    locals.set(key, type);
  };

  const walk = (
    commands: readonly FieldEventCommand[],
    locals: Map<string, EventLocalType>,
    branchDepth: number,
  ): void => {
    for (const command of commands) {
      stepCount += 1;
      switch (command.type) {
        case 'dialogue':
        case 'set-flag':
          break;
        case 'choice':
          defineLocal(command.key, 'choice', locals);
          break;
        case 'question':
          defineLocal(command.key, 'score', locals);
          break;
        case 'reward':
          requireLocal(command.scoreKey, 'score', locals);
          for (const row of command.table) validateReward(row.reward, references, report);
          break;
        case 'battle':
          if (!references.monsters.has(command.enemyId)) report(`enemy "${command.enemyId}" が存在しません`);
          defineLocal(command.key, 'battle', locals);
          break;
        case 'warp':
          if (!references.maps.has(command.map)) report(`map "${command.map}" が存在しません`);
          break;
        case 'branch': {
          validateCondition(command.condition, locals);
          const nextDepth = branchDepth + 1;
          maxBranchDepth = Math.max(maxBranchDepth, nextDepth);
          walk(command.then, new Map(locals), nextDepth);
          if (command.else) walk(command.else, new Map(locals), nextDepth);
          break;
        }
      }
    }
  };

  walk(event.steps, new Map(), 0);
  if (stepCount > EVENT_STEP_LIMIT) report(`steps は ${EVENT_STEP_LIMIT} 以下にしてください（${stepCount}）`);
  if (maxBranchDepth > EVENT_BRANCH_DEPTH_LIMIT)
    report(`branch の深さは ${EVENT_BRANCH_DEPTH_LIMIT} 以下にしてください（${maxBranchDepth}）`);
  return errors;
}
