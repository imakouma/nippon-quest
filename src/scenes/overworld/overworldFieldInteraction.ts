import type {
  FieldInteractionCandidate,
  FieldInteractionIntent,
  FieldPosition,
} from './fieldInteractionRouter';
import type { MapTransitionRequest } from './mapTransitionPipeline';

export interface OverworldFieldInteractionSnapshot {
  intent: FieldInteractionIntent;
  player: FieldPosition;
  front: FieldPosition;
  playerTile: number;
  frontTile: number;
  counterNpc?: { tile: number; position: FieldPosition };
  transition?: { locked: boolean; request: MapTransitionRequest };
  warp: boolean;
  triggerId?: string;
  bosses: {
    mid: boolean;
    region: boolean;
    area: boolean;
    last: boolean;
  };
  objects: {
    npc: boolean;
    chest: boolean;
    chestUnderfoot: boolean;
    sign: boolean;
    signUnderfoot: boolean;
  };
  nearby: readonly {
    tile: number;
    position: FieldPosition;
    npc: boolean;
    chest: boolean;
    sign: boolean;
  }[];
}

interface TileLookup {
  has(tile: number): boolean;
}

interface TriggerLookup {
  get(tile: number): { id: string; auto(): boolean } | undefined;
}

export interface OverworldFieldInteractionSource {
  width: number;
  canWarp: boolean;
  transitions: ReadonlyMap<number, { map: string; spawn: string }>;
  isLocked(tile: number): boolean;
  warpTile: number | null;
  triggers: TriggerLookup;
  insideTrigger: string | null;
  midBossTile: number | null;
  regionBosses: TileLookup;
  areaBossTile: number | null;
  lastBossTile: number | null;
  npcs: TileLookup;
  chests: TileLookup;
  signs: TileLookup;
}

export function collectOverworldFieldInteractionCandidates(
  source: OverworldFieldInteractionSource,
  intent: FieldInteractionIntent,
  player: FieldPosition,
  front: FieldPosition,
): { candidates: FieldInteractionCandidate[]; insideTrigger: string | null } {
  if (intent === 'menu')
    return {
      candidates: [{ id: 'menu', kind: 'menu', activation: 'menu' }],
      insideTrigger: source.insideTrigger,
    };
  const indexOf = (position: FieldPosition) => position.y * source.width + position.x;
  const playerTile = indexOf(player);
  const frontTile = indexOf(front);
  const counterPosition = { x: front.x + (front.x - player.x), y: front.y + (front.y - player.y) };
  const counterTile = indexOf(counterPosition);
  const nearby: Array<OverworldFieldInteractionSnapshot['nearby'][number]> = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const position = { x: player.x + dx, y: player.y + dy };
      if (
        (position.x === player.x && position.y === player.y) ||
        (position.x === front.x && position.y === front.y)
      )
        continue;
      const tile = indexOf(position);
      nearby.push({
        tile,
        position,
        npc: source.npcs.has(tile),
        chest: source.chests.has(tile),
        sign: source.signs.has(tile),
      });
    }
  const transition = source.transitions.get(playerTile);
  const trigger = source.triggers.get(playerTile);
  const triggerActive = !!trigger && trigger.id !== source.insideTrigger && trigger.auto();
  const insideTrigger = !trigger ? null : triggerActive ? source.insideTrigger : trigger.id;
  return {
    insideTrigger,
    candidates: buildOverworldFieldInteractionCandidates({
      intent,
      player,
      front,
      playerTile,
      frontTile,
      counterNpc: source.npcs.has(counterTile) ? { tile: counterTile, position: counterPosition } : undefined,
      transition:
        transition && source.canWarp
          ? {
              locked: source.isLocked(playerTile),
              request: { targetMap: transition.map, spawnName: transition.spawn, reason: 'door' },
            }
          : undefined,
      warp: source.warpTile === playerTile,
      triggerId: triggerActive ? trigger.id : undefined,
      bosses: {
        mid: source.midBossTile === frontTile,
        region: source.regionBosses.has(frontTile),
        area: source.areaBossTile === frontTile,
        last: source.lastBossTile === frontTile,
      },
      objects: {
        npc: source.npcs.has(frontTile),
        chest: source.chests.has(frontTile),
        chestUnderfoot: source.chests.has(playerTile),
        sign: source.signs.has(frontTile),
        signUnderfoot: source.signs.has(playerTile),
      },
      nearby,
    }),
  };
}

export function fieldGateIcon(kind: string, target: string): string {
  if (kind !== 'field' && kind !== 'enclave') return 'fld.gate';
  if (target.endsWith('-town')) return 'fld.icon.town';
  if (target.endsWith('-dungeon')) return 'fld.icon.cave';
  if (target.endsWith('-secret')) return 'fld.icon.castle';
  return 'fld.icon.port';
}

export function isHarborTransition(
  kind: string,
  target: string,
  enclaves: readonly { enclaveId: string }[],
): boolean {
  if (kind === 'field') return enclaves.some((enclave) => enclave.enclaveId === target);
  return kind === 'enclave' && target.endsWith('-field');
}

/** Phaser objectsを含まないsnapshotを、router用の正規化候補へ変換する。 */
export function buildOverworldFieldInteractionCandidates(
  snapshot: OverworldFieldInteractionSnapshot,
): FieldInteractionCandidate[] {
  if (snapshot.intent === 'menu') return [{ id: 'menu', kind: 'menu', activation: 'menu' }];
  const candidates: FieldInteractionCandidate[] = [];
  if (snapshot.intent === 'arrive') {
    if (snapshot.transition)
      candidates.push(
        snapshot.transition.locked
          ? {
              id: String(snapshot.playerTile),
              kind: 'locked-transition',
              activation: 'underfoot',
              position: snapshot.player,
            }
          : {
              id: String(snapshot.playerTile),
              kind: 'map-transition',
              activation: 'underfoot',
              position: snapshot.player,
              request: snapshot.transition.request,
            },
      );
    if (snapshot.warp)
      candidates.push({
        id: String(snapshot.playerTile),
        kind: 'warp',
        activation: 'underfoot',
        position: snapshot.player,
      });
    if (snapshot.triggerId)
      candidates.push({
        id: snapshot.triggerId,
        kind: 'field-event',
        activation: 'underfoot',
        position: snapshot.player,
      });
    candidates.push({
      id: String(snapshot.playerTile),
      kind: 'battle',
      battleType: 'random',
      activation: 'underfoot',
      position: snapshot.player,
    });
    return candidates;
  }

  for (const [enabled, battleType] of [
    [snapshot.bosses.mid, 'mid-boss'],
    [snapshot.bosses.region, 'region-boss'],
    [snapshot.bosses.area, 'area-boss'],
    [snapshot.bosses.last, 'last-boss'],
  ] as const)
    if (enabled)
      candidates.push({
        id: String(snapshot.frontTile),
        kind: 'battle',
        battleType,
        activation: 'front',
        position: snapshot.front,
      });
  if (snapshot.objects.npc)
    candidates.push({
      id: String(snapshot.frontTile),
      kind: 'npc',
      activation: 'front',
      position: snapshot.front,
    });
  if (snapshot.counterNpc)
    candidates.push({
      id: String(snapshot.counterNpc.tile),
      kind: 'npc',
      activation: 'counter',
      position: snapshot.counterNpc.position,
    });
  if (snapshot.objects.chest)
    candidates.push({
      id: String(snapshot.frontTile),
      kind: 'chest',
      activation: 'front',
      position: snapshot.front,
    });
  if (snapshot.objects.chestUnderfoot)
    candidates.push({
      id: String(snapshot.playerTile),
      kind: 'chest',
      activation: 'underfoot',
      position: snapshot.player,
    });
  if (snapshot.objects.sign)
    candidates.push({
      id: String(snapshot.frontTile),
      kind: 'sign',
      activation: 'front',
      position: snapshot.front,
    });
  if (snapshot.objects.signUnderfoot)
    candidates.push({
      id: String(snapshot.playerTile),
      kind: 'sign',
      activation: 'underfoot',
      position: snapshot.player,
    });
  for (const nearby of snapshot.nearby) {
    if (nearby.npc)
      candidates.push({
        id: String(nearby.tile),
        kind: 'npc',
        activation: 'nearby',
        position: nearby.position,
      });
    if (nearby.chest)
      candidates.push({
        id: String(nearby.tile),
        kind: 'chest',
        activation: 'nearby',
        position: nearby.position,
      });
    if (nearby.sign)
      candidates.push({
        id: String(nearby.tile),
        kind: 'sign',
        activation: 'nearby',
        position: nearby.position,
      });
  }
  return candidates;
}

export interface OverworldFieldInteractionHandlers {
  menu(): void;
  lockedTransition(tile: number): void;
  warp(): void;
  fieldEvent(id: string): void;
  battle(type: Extract<FieldInteractionCandidate, { kind: 'battle' }>['battleType'], tile: number): void;
  npc(tile: number): void;
  chest(tile: number): void;
  sign(tile: number): void;
}

/** Scene固有処理をtyped portへ一度だけdispatchする。runtime所有候補は呼び出し元で処理済み。 */
export function dispatchOverworldFieldInteraction(
  candidate: FieldInteractionCandidate,
  handlers: OverworldFieldInteractionHandlers,
): void {
  const tile = Number(candidate.id);
  switch (candidate.kind) {
    case 'menu':
      handlers.menu();
      break;
    case 'locked-transition':
      handlers.lockedTransition(tile);
      break;
    case 'warp':
      handlers.warp();
      break;
    case 'field-event':
      handlers.fieldEvent(candidate.id);
      break;
    case 'battle':
      handlers.battle(candidate.battleType, tile);
      break;
    case 'npc':
      handlers.npc(tile);
      break;
    case 'chest':
      handlers.chest(tile);
      break;
    case 'sign':
    case 'background':
      handlers.sign(tile);
      break;
    case 'event-command':
    case 'map-transition':
      break;
  }
}
