import type { Grade, RubyText, Subject } from '../../questions/contracts';
import type { MapObjectMovementCommand } from './mapObjectMovementRuntime';

export interface EventDialogueLine {
  speaker?: RubyText;
  face?: string;
  text: RubyText;
}

export interface EventQuestionRequest {
  subject: Subject;
  gradeRange: readonly [Grade, Grade];
  tags?: readonly string[];
  type?: string;
}

export interface EventReward {
  gold?: number;
  xp?: number;
  items?: readonly { itemId: string; n?: number }[];
  skills?: readonly string[];
  recipes?: readonly string[];
  unlockMonsters?: readonly string[];
  title?: RubyText;
}

export interface RewardByScore {
  min: number;
  reward: EventReward;
}

export interface DialogueCommand {
  type: 'dialogue';
  lines: readonly EventDialogueLine[];
}

export interface ChoiceCommand {
  type: 'choice';
  key: string;
  lines: readonly EventDialogueLine[];
  choices: readonly RubyText[];
}

export interface QuestionCommand {
  type: 'question';
  key: string;
  request: EventQuestionRequest;
}

export interface RewardCommand {
  type: 'reward';
  scoreKey: string;
  table: readonly RewardByScore[];
}

export interface SetFlagCommand {
  type: 'set-flag';
  flag: string;
}

export interface BattleCommand {
  type: 'battle';
  key: string;
  enemyId: string;
  level?: number;
  isBoss?: boolean;
}

export interface WarpCommand {
  type: 'warp';
  map: string;
  spawn?: string;
}

export interface MovementCommand {
  type: 'movement';
  objectId: string;
  commands: readonly MapObjectMovementCommand[];
}

export type EventCondition =
  | { type: 'choice'; key: string; equals: number }
  | { type: 'score'; key: string; min: number; max?: number }
  | { type: 'battle'; key: string; outcome: BattleOutcome }
  | { type: 'flag'; flag: string; isSet?: boolean };

export interface BranchCommand {
  type: 'branch';
  condition: EventCondition;
  then: readonly FieldEventCommand[];
  else?: readonly FieldEventCommand[];
}

export type FieldEventCommand =
  | DialogueCommand
  | ChoiceCommand
  | QuestionCommand
  | RewardCommand
  | SetFlagCommand
  | BattleCommand
  | WarpCommand
  | MovementCommand
  | BranchCommand;

export interface ScriptedAreaEvent {
  id: string;
  motifId: string;
  trigger: { map: string; objectName: string };
  once: boolean;
  cutinImageKey?: string;
  steps: readonly FieldEventCommand[];
}

export type BattleOutcome = 'victory' | 'defeat';

export type EventLocalResult =
  | { type: 'choice'; value: number }
  | { type: 'score'; value: number }
  | { type: 'battle'; value: BattleOutcome };

export interface EventRuntimePorts {
  dialogue(lines: readonly EventDialogueLine[]): Promise<void>;
  choose(lines: readonly EventDialogueLine[], choices: readonly RubyText[]): Promise<number>;
  question(request: EventQuestionRequest): Promise<number>;
  reward(table: readonly RewardByScore[], score: number): Promise<void>;
  setFlag(flag: string): void;
  battle(command: BattleCommand): Promise<BattleOutcome>;
  warp(command: WarpCommand): Promise<void>;
  movement(command: MovementCommand, signal: AbortSignal): Promise<void>;
}

export interface EventRuntimeOptions {
  signal: AbortSignal;
  flags?: ReadonlySet<string>;
}

export interface EventRuntimeResult {
  executedSteps: number;
  locals: ReadonlyMap<string, EventLocalResult>;
  flags: ReadonlySet<string>;
}
