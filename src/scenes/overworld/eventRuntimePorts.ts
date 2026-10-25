import { h, render } from 'preact';
import type { ContentIndex } from '../../core/content/loader';
import type { AreaEvent } from '../../core/content/schemas';
import { legacyAreaEventCommands } from '../../core/events/legacyAreaEvent';
import { executeEventCommands } from '../../core/events/runtime';
import { applyReward, markDone, pickReward, type RewardLine } from '../../core/progression/eventReward';
import type { GameState } from '../../core/state/schema';
import type {
  BattleCommand,
  EventDialogueLine,
  EventQuestionRequest,
  EventRuntimePorts,
  RewardByScore,
} from '../../core/events/contracts';
import type { RubyText } from '../../questions/contracts';
import { MasteryStore, type QuestionBank } from '../../questions/engine';
import { scopeQueryToGrade } from '../../questions/engine/gradeScope';
import { QuestionFrame } from '../../ui/QuestionFrame';
import type { BattleSceneData } from '../battle/contracts';
import { askFirst, buildAskEnv, relaxedQueries } from '../shared/askEnv';
import type { EncounterLifecycle } from './encounterLifecycle';
import type { FieldFlowContext, FieldFlowRuntime } from './fieldFlowRuntime';
import { runMapTransition, type MapTransitionPorts } from './mapTransitionPipeline';

export interface EventQuestionPortOptions {
  request: EventQuestionRequest;
  title: RubyText;
  hint: RubyText;
  root: HTMLElement;
  game: GameState | undefined;
  content: ContentIndex | undefined;
  bank: QuestionBank | undefined;
  rng: { next(): number };
  speak(text: string): void;
  noQuestion(): Promise<void>;
}

export async function askEventQuestion(options: EventQuestionPortOptions): Promise<number> {
  const { bank, content, game } = options;
  if (!bank || !content || !game) return 0;
  const host = document.createElement('div');
  host.className = 'nq-bq-slot';
  render(
    h(QuestionFrame, {
      host,
      title: options.title,
      subject: options.request.subject,
      hint: options.hint,
    }),
    options.root,
  );
  const query = scopeQueryToGrade(
    {
      subject: options.request.subject,
      gradeRange: [...options.request.gradeRange],
      ...(options.request.tags ? { tags: [...options.request.tags] } : {}),
      ...(options.request.type ? { type: options.request.type } : {}),
    },
    game.learning.grade,
  );
  let score: number | null = null;
  try {
    score = await askFirst(
      buildAskEnv({
        host,
        gs: game,
        content,
        bank,
        mastery: new MasteryStore(game.learning.mastery),
        rng: options.rng,
        speak: options.speak,
        reason: 'event',
        getGame: () => game,
      }),
      relaxedQueries(query),
    );
  } finally {
    render(null, options.root);
  }
  if (score !== null) return score;
  await options.noQuestion();
  return 0;
}

export interface EventRuntimePortOptions {
  flow: FieldFlowContext;
  encounter: EncounterLifecycle;
  transitions: MapTransitionPorts;
  eventId: string;
  stamp: string;
  getGame(): GameState | undefined;
  setGame(game: GameState): void;
  dialogue(lines: readonly EventDialogueLine[]): Promise<void>;
  choose(lines: readonly EventDialogueLine[], choices: readonly RubyText[]): Promise<number>;
  question(request: EventQuestionRequest): Promise<number>;
  showReward(lines: readonly RewardLine[]): Promise<void>;
  onFlagSet(flag: string): void;
  nextEncounterId(): string;
  battleData(command: BattleCommand): BattleSceneData;
}

function mutableRewardTable(table: readonly RewardByScore[]) {
  return table.map(({ min, reward }) => ({
    min,
    reward: {
      gold: reward.gold,
      xp: reward.xp,
      title: reward.title,
      items: reward.items?.map((item) => ({ itemId: item.itemId, n: item.n ?? 1 })),
      skills: reward.skills ? [...reward.skills] : undefined,
      recipes: reward.recipes ? [...reward.recipes] : undefined,
      unlockMonsters: reward.unlockMonsters ? [...reward.unlockMonsters] : undefined,
    },
  }));
}

export function createEventRuntimePorts(options: EventRuntimePortOptions): EventRuntimePorts {
  return {
    dialogue: options.dialogue,
    choose: options.choose,
    question: options.question,
    async reward(table, score) {
      const game = options.getGame();
      if (!game) throw new Error('event reward requires an active game state');
      const applied = applyReward(game, pickReward(mutableRewardTable(table), score));
      options.setGame(applied.state);
      await options.showReward(applied.lines);
    },
    setFlag(flag) {
      const game = options.getGame();
      if (!game) throw new Error('event flag requires an active game state');
      options.setGame(
        markDone(game, {
          flag,
          ...(flag === options.eventId ? { eventId: options.eventId, stamp: options.stamp } : {}),
        }),
      );
      options.onFlagSet(flag);
    },
    async battle(command) {
      const result = await options.encounter.startInFlow(
        {
          id: options.nextEncounterId(),
          battle: options.battleData(command),
          source: { type: 'script' },
        },
        options.flow,
      );
      if (!result) throw new Error('scripted encounter could not start');
      return result.outcome === 'victory' ? 'victory' : 'defeat';
    },
    warp: (command) =>
      runMapTransition(
        {
          targetMap: command.map,
          ...(command.spawn ? { spawnName: command.spawn } : {}),
          reason: 'script',
        },
        options.transitions,
        options.flow.signal,
      ),
  };
}

interface AreaEventFlowOptions extends Omit<EventRuntimePortOptions, 'flow'> {
  event: AreaEvent;
  flowRuntime: FieldFlowRuntime;
  motifBlurb: RubyText;
  standStill(): void;
  arrive(): Promise<EventDialogueLine[]>;
  checkSpecialty(): Promise<void>;
  landmarkSpeaker: RubyText;
  stampOwned: RubyText;
  legacyPrompt: { ask: RubyText; choices: [RubyText, RubyText]; later: RubyText };
}

/** Runs both legacy and scripted area events under one exclusive field-flow lifecycle. */
export async function runAreaEventFlow(options: AreaEventFlowOptions): Promise<void> {
  await options.flowRuntime.run('area-event', async (flow) => {
    options.standStill();
    const stampLine = await options.arrive();
    flow.throwIfCancelled();
    const game = options.getGame();
    if (options.event.once && game?.progress.eventsDone.includes(options.event.id)) {
      await options.dialogue([
        { speaker: options.landmarkSpeaker, text: options.motifBlurb },
        ...(stampLine.length ? stampLine : [{ text: options.stampOwned }]),
      ]);
      flow.throwIfCancelled();
      await options.checkSpecialty();
      return;
    }
    if (!game) return;
    const commands =
      'steps' in options.event
        ? options.event.steps
        : legacyAreaEventCommands(options.event, options.legacyPrompt);
    await executeEventCommands(
      stampLine.length ? [{ type: 'dialogue', lines: stampLine }, ...commands] : commands,
      createEventRuntimePorts({ ...options, flow }),
      { signal: flow.signal, flags: new Set(game.progress.eventsDone) },
    );
    flow.throwIfCancelled();
    await options.checkSpecialty();
  });
}
