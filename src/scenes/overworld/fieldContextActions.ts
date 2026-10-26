import type { Dir } from '../../shared/world';
import type { ResolvedContextAction } from './contextAction';
import type { ContextActionView } from '../../ui/field/ContextActionButton';

interface TileTarget {
  tile: number;
}

interface FieldContextActionSources<TNpc, TChest, TRegionBoss> {
  playerTile(): readonly [number, number];
  facing(): Dir;
  indexOf(x: number, y: number): number;
  isCounter(x: number, y: number): boolean;
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
  activate(): void;
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
  private presentedKind: ResolvedContextAction['kind'] | null = null;

  constructor(private readonly source: FieldContextActionSources<TNpc, TChest, TRegionBoss>) {}

  refresh(): ResolvedContextAction | null {
    this.current = this.resolve();
    return this.current;
  }

  sync(): boolean {
    return (this.refresh()?.kind ?? null) !== this.presentedKind;
  }

  activate(): boolean {
    const action = this.refresh();
    if (!action) return false;
    action.onActivate();
    return true;
  }

  view(translate: (key: string) => string, onActivate: () => void): ContextActionView | null {
    const action = this.refresh();
    this.presentedKind = action?.kind ?? null;
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
    const frontX = x + dx;
    const frontY = y + dy;
    const current = this.source.indexOf(x, y);
    const front = this.source.indexOf(frontX, frontY);
    const nearby: number[] = [];
    for (let offsetY = -1; offsetY <= 1; offsetY++)
      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        if ((offsetX === 0 && offsetY === 0) || (offsetX === dx && offsetY === dy)) continue;
        nearby.push(this.source.indexOf(x + offsetX, y + offsetY));
      }
    const midBoss = this.source.midBoss();
    const areaBoss = this.source.areaBoss();
    const lastBoss = this.source.lastBoss();
    const regionBoss = this.source.regionBosses().get(front);
    if (Object.values(this.state()).some(Boolean)) return null;
    if (midBoss?.tile === front || regionBoss || areaBoss?.tile === front || lastBoss?.tile === front)
      return this.action('talk');

    const counter = this.source.isCounter(frontX, frontY)
      ? this.source.indexOf(frontX + dx, frontY + dy)
      : null;
    if (
      this.source.npcs().has(front) ||
      (counter !== null && this.source.npcs().has(counter)) ||
      nearby.some((index) => this.source.npcs().has(index))
    )
      return this.action('talk');

    if (
      [front, current, ...nearby].some((index) => {
        const chest = this.source.chests().get(index);
        return chest !== undefined && !this.source.chestOpened(chest);
      })
    )
      return this.action('open');
    if ([front, current, ...nearby].some((index) => this.source.signs().has(index)))
      return this.action('inspect');
    return null;
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

  private action(kind: ResolvedContextAction['kind']): ResolvedContextAction {
    return { kind, onActivate: this.source.activate };
  }
}
