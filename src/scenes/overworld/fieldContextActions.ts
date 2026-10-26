import type { Dir } from '../../shared/world';
import { resolveContextAction, type ContextActionTile, type ResolvedContextAction } from './contextAction';
import type { ContextActionView } from '../../ui/field/ContextActionButton';

interface TileTarget {
  tile: number;
}

interface FieldContextActionSources<TNpc, TChest, TRegionBoss> {
  playerTile(): readonly [number, number];
  facing(): Dir;
  indexOf(x: number, y: number): number;
  phase(): 'idle' | 'turning' | 'stepping' | 'bumping' | 'scripted' | 'frozen';
  busy(): boolean;
  inBattle(): boolean;
  inputLocked(): boolean;
  overlayOwnsInput(): boolean;
  npcs(): ReadonlyMap<number, TNpc>;
  chests(): ReadonlyMap<number, TChest>;
  signs(): ReadonlyMap<number, () => void>;
  midBoss(): TileTarget | null;
  regionBosses(): ReadonlyMap<number, TRegionBoss>;
  areaBoss(): TileTarget | null;
  lastBoss(): TileTarget | null;
  chestOpened(chest: TChest): boolean;
  activateNpc(npc: TNpc): void;
  activateChest(chest: TChest): void;
  activateMidBoss(): void;
  activateRegionBoss(boss: TRegionBoss): void;
  activateAreaBoss(): void;
  activateLastBoss(): void;
}

const DELTA: Record<Dir, readonly [number, number]> = {
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
};

/** Keeps one canonical nearby-target resolver for DOM buttons and keyboard input. */
export class FieldContextActions<TNpc, TChest, TRegionBoss> {
  current: ResolvedContextAction | null = null;

  constructor(private readonly source: FieldContextActionSources<TNpc, TChest, TRegionBoss>) {}

  refresh(): ResolvedContextAction | null {
    this.current = this.resolve();
    return this.current;
  }

  sync(): boolean {
    const previousKind = this.current?.kind;
    return this.refresh()?.kind !== previousKind;
  }

  activate(): boolean {
    const action = this.refresh();
    if (!action) return false;
    action.onActivate();
    return true;
  }

  view(translate: (key: string) => string, onActivate: () => void): ContextActionView | null {
    const action = this.refresh();
    const key =
      action?.kind === 'talk'
        ? 'field.contextTalk'
        : action?.kind === 'open'
          ? 'field.contextOpen'
          : 'field.contextInspect';
    return action ? { kind: action.kind, label: translate(key), onActivate } : null;
  }

  private resolve(): ResolvedContextAction | null {
    const [x, y] = this.source.playerTile();
    const [dx, dy] = DELTA[this.source.facing()];
    const front = this.source.indexOf(x + dx, y + dy);
    const surrounding: ContextActionTile[] = [];
    for (let offsetY = -1; offsetY <= 1; offsetY++)
      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        if (offsetX === 0 && offsetY === 0) continue;
        surrounding.push(this.tile(this.source.indexOf(x + offsetX, y + offsetY)));
      }
    const midBoss = this.source.midBoss();
    const areaBoss = this.source.areaBoss();
    const lastBoss = this.source.lastBoss();
    const regionBoss = this.source.regionBosses().get(front);
    return resolveContextAction({
      state: this.state(),
      bosses: {
        midBoss: midBoss?.tile === front ? () => this.source.activateMidBoss() : undefined,
        regionBoss: regionBoss ? () => this.source.activateRegionBoss(regionBoss) : undefined,
        areaBoss: areaBoss?.tile === front ? () => this.source.activateAreaBoss() : undefined,
        lastBoss: lastBoss?.tile === front ? () => this.source.activateLastBoss() : undefined,
      },
      front: this.tile(front),
      current: this.tile(this.source.indexOf(x, y)),
      surrounding,
    });
  }

  private state() {
    const phase = this.source.phase();
    return {
      moving: phase === 'stepping',
      turning: phase === 'turning',
      bumping: phase === 'bumping',
      busy: this.source.busy() || this.source.inputLocked() || phase === 'scripted' || phase === 'frozen',
      inBattle: this.source.inBattle(),
      overlayOwnsInput: this.source.overlayOwnsInput(),
    };
  }

  private tile(index: number): ContextActionTile {
    const npc = this.source.npcs().get(index);
    const chest = this.source.chests().get(index);
    const inspect = this.source.signs().get(index);
    return {
      npc: npc ? () => this.source.activateNpc(npc) : undefined,
      chest: chest
        ? { opened: this.source.chestOpened(chest), onActivate: () => this.source.activateChest(chest) }
        : undefined,
      inspect,
    };
  }
}
