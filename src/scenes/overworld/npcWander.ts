import type Phaser from 'phaser';
import type { DialogueLine } from '../../ui/dialogue';

export type NpcWanderDir = 'down' | 'left' | 'right' | 'up';

export interface NpcWanderStep {
  x: number;
  y: number;
  dir: NpcWanderDir;
}

const STEPS: readonly NpcWanderStep[] = [
  { x: 0, y: 1, dir: 'down' },
  { x: -1, y: 0, dir: 'left' },
  { x: 1, y: 0, dir: 'right' },
  { x: 0, y: -1, dir: 'up' },
];

/** 一般の町人が初期位置から離れすぎずに歩ける、隣接マスの候補。 */
export function npcWanderCandidates(
  home: readonly [number, number],
  at: readonly [number, number],
  radius = 2,
): NpcWanderStep[] {
  return STEPS.map((step) => ({ x: at[0] + step.x, y: at[1] + step.y, dir: step.dir })).filter(
    ({ x, y }) => Math.abs(x - home[0]) <= radius && Math.abs(y - home[1]) <= radius,
  );
}

/** 歩行中の絵に合わせ、前半は出発マス、後半は到着マスを当たり判定にする。 */
export const npcWanderTile = (from: number, to: number, progress: number): number =>
  progress < 0.5 ? from : to;

export interface WanderingNpc {
  key: string;
  role: string;
  name: string;
  lines: DialogueLine[];
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Image;
  home: [number, number];
  moving: boolean;
  nextMoveAt: number;
  targetTile?: number;
  ferry?: { map: string; spawn: string; place: string; back: boolean };
}

/** 到着マスを予約し、見た目の歩行に合わせて当たり判定も1マス動かす。 */
export function advanceWanderingNpcs<T extends WanderingNpc>(input: {
  time: number;
  npcs: Map<number, T>;
  blocked: Set<number>;
  player: readonly [number, number];
  tileSize: number;
  stepMs: number;
  inside: (x: number, y: number) => boolean;
  indexOf: (x: number, y: number) => number;
  isBlocked: (x: number, y: number) => boolean;
  isTransition: (index: number) => boolean;
  randomInt: (min: number, max: number) => number;
  frame: (dir: NpcWanderDir, step: 0 | 1 | 2) => number;
  tweens: Phaser.Tweens.TweenManager;
  now: () => number;
}): void {
  for (const [tile, npc] of [...input.npcs]) {
    if (npc.role !== 'talk' || npc.moving || input.time < npc.nextMoveAt) continue;
    const at: [number, number] = [
      Math.floor(npc.sprite.x / input.tileSize),
      Math.floor(npc.sprite.y / input.tileSize),
    ];
    const candidates = npcWanderCandidates(npc.home, at);
    const reserved = new Set([...input.npcs.values()].flatMap((other) => other.targetTile ?? []));
    const start = input.randomInt(0, candidates.length - 1);
    const step = candidates
      .slice(start)
      .concat(candidates.slice(0, start))
      .find(({ x, y }) => {
        const tileIndex = input.indexOf(x, y);
        return (
          input.inside(x, y) &&
          !input.isBlocked(x, y) &&
          !reserved.has(tileIndex) &&
          !input.isTransition(tileIndex) &&
          (x !== input.player[0] || y !== input.player[1])
        );
      });
    if (!step) {
      npc.nextMoveAt = input.time + input.randomInt(700, 1400);
      continue;
    }
    const nextTile = input.indexOf(step.x, step.y);
    npc.moving = true;
    npc.targetTile = nextTile;
    let occupiedTile = tile;
    const occupy = (next: number) => {
      if (next === occupiedTile) return;
      input.npcs.delete(occupiedTile);
      input.blocked.delete(occupiedTile);
      input.npcs.set(next, npc);
      input.blocked.add(next);
      occupiedTile = next;
    };
    npc.sprite.setFrame(input.frame(step.dir, 0));
    input.tweens.add({
      targets: [npc.sprite, npc.shadow],
      x: step.x * input.tileSize + input.tileSize / 2,
      y: (target: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image) =>
        step.y * input.tileSize + input.tileSize / 2 + (target === npc.shadow ? 6 : 0),
      duration: input.stepMs * 2,
      onUpdate: (tween) => {
        occupy(npcWanderTile(tile, nextTile, tween.progress));
        npc.sprite.setDepth(npc.sprite.y);
      },
      onComplete: () => {
        occupy(nextTile);
        npc.sprite.setFrame(input.frame(step.dir, 1));
        npc.moving = false;
        npc.targetTile = undefined;
        npc.nextMoveAt = input.now() + input.randomInt(1400, 3200);
      },
    });
  }
}
