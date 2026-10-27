import type { BattleEvent, BattleState, Combatant } from '../../core/battle/types';
import { narrate, normalizeEvents, type NarrateCtx } from './narrate';

export interface StatusEffectView {
  kind: 'attack' | 'defense' | 'stopped';
  direction: 'up' | 'down' | 'neutral';
  turns: number;
}

export interface BattleHistoryEntry {
  /** `BattleState.log` 内の1始まりの位置。 */
  eventIndex: number;
  lines: string[];
}

export interface HpChangeView {
  before: number;
  after: number;
  delta: number;
}

export interface BattleTimelineEntry {
  eventIndex: number;
  turn: number;
  t: BattleEvent['t'];
  actorId?: string;
  targetId?: string;
  command?: 'attack' | 'skill' | 'scan' | 'defend';
  skillId?: string;
  side?: 'ally' | 'enemy';
  hp?: HpChangeView;
}

export interface BattleHistoryView {
  recent: BattleHistoryEntry[];
  timeline: BattleTimelineEntry[];
  totalPresentedEvents: number;
  omittedTimelineEvents: number;
}

const TIMELINE_LIMIT = 120;
const RECENT_LIMIT = 4;

function buffEffect(
  kind: StatusEffectView['kind'],
  buff: Combatant['buffs']['atk'],
): StatusEffectView | null {
  if (!buff || buff.turns <= 0 || buff.mult === 1) return null;
  return { kind, direction: buff.mult > 1 ? 'up' : 'down', turns: buff.turns };
}

export function buildStatusEffects(combatant: Combatant, stoppedTurns = 0): StatusEffectView[] {
  const effects = [
    buffEffect('attack', combatant.buffs.atk),
    buffEffect('defense', combatant.buffs.def),
  ].filter((effect): effect is StatusEffectView => effect !== null);
  if (stoppedTurns > 0) effects.push({ kind: 'stopped', direction: 'neutral', turns: stoppedTurns });
  return effects;
}

function normalizedWithIndices(events: readonly BattleEvent[]): Array<{ event: BattleEvent; index: number }> {
  const indices = new Map<BattleEvent, number[]>();
  events.forEach((event, index) => {
    const matches = indices.get(event);
    if (matches) matches.push(index);
    else indices.set(event, [index]);
  });

  return normalizeEvents(events).map((event) => ({ event, index: indices.get(event)!.shift()! }));
}

function hpByCombatant(state: BattleState): Map<string, { hp: number; maxHp: number }> {
  const combatants = [state.ally.hero, ...state.ally.monsters, state.enemy];
  return new Map(
    combatants.map((combatant) => [combatant.id, { hp: combatant.hp, maxHp: combatant.stats.hp }]),
  );
}

function reconstructHpChanges(state: BattleState): Map<number, HpChangeView> {
  const hp = hpByCombatant(state);
  const changes = new Map<number, HpChangeView>();

  for (let index = state.log.length - 1; index >= 0; index--) {
    const event = state.log[index]!;
    if (event.t !== 'damage' && event.t !== 'heal') continue;
    const target = hp.get(event.targetId);
    if (!target) continue;

    const after = target.hp;
    const before =
      event.t === 'damage' ? Math.min(target.maxHp, after + event.amount) : Math.max(0, after - event.amount);
    const delta = event.t === 'damage' ? -event.amount : event.amount;
    changes.set(index, { before, after, delta });
    target.hp = before;
  }

  return changes;
}

type TimelineDetails = Pick<BattleTimelineEntry, 'actorId' | 'targetId' | 'command' | 'skillId' | 'side'>;

function timelineDetails(event: BattleEvent): TimelineDetails {
  switch (event.t) {
    case 'act':
      return {
        actorId: event.actorId,
        command: event.command,
        skillId: event.skillId,
        side: event.side,
      };
    case 'damage':
    case 'heal':
    case 'buff':
    case 'itemUsed':
    case 'ko':
      return { targetId: event.targetId, side: event.side };
    case 'status':
    case 'skipTurn':
    case 'weaknessRevealed':
    case 'scanFailed':
    case 'recruitGift':
    case 'recruitAttempt':
      return { targetId: event.targetId };
    case 'turnStart':
    case 'combo':
    case 'gaugeCharge':
    case 'gaugeUse':
    case 'gaugeShort':
    case 'swap':
    case 'fleeAttempt':
    case 'bossPhase':
    case 'victory':
    case 'defeat':
    case 'fled':
    case 'recruited':
      return {};
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unknown battle event: ${JSON.stringify(value)}`);
}

function timelineEntries(state: BattleState, presentedCount: number): BattleTimelineEntry[] {
  const hpChanges = reconstructHpChanges(state);
  let turn = 1;
  return state.log.slice(0, presentedCount).map((event, index) => {
    if (event.t === 'turnStart') turn = event.turn;
    return {
      eventIndex: index + 1,
      turn,
      t: event.t,
      ...timelineDetails(event),
      hp: hpChanges.get(index),
    };
  });
}

export function buildBattleHistoryView(
  state: BattleState,
  ctx: NarrateCtx,
  presentedEventCount: number,
  includeTimeline: boolean,
): BattleHistoryView {
  const totalPresentedEvents = Math.max(0, Math.min(state.log.length, Math.floor(presentedEventCount)));
  const presented = state.log.slice(0, totalPresentedEvents);
  const normalized = normalizedWithIndices(presented);
  const narrated = normalized.flatMap(({ event, index }, normalizedIndex) => {
    const lines = narrate(event, ctx, normalized[normalizedIndex - 1]?.event);
    return lines.length > 0 ? [{ eventIndex: index + 1, lines }] : [];
  });
  const recent = narrated.slice(-RECENT_LIMIT);

  if (!includeTimeline) {
    return { recent, timeline: [], totalPresentedEvents, omittedTimelineEvents: 0 };
  }

  const allTimeline = timelineEntries(state, totalPresentedEvents);
  const omittedTimelineEvents = Math.max(0, allTimeline.length - TIMELINE_LIMIT);
  return {
    recent,
    timeline: allTimeline.slice(-TIMELINE_LIMIT),
    totalPresentedEvents,
    omittedTimelineEvents,
  };
}
