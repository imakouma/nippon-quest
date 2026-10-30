import type Phaser from 'phaser';
import type { ContentIndex } from '../../core/content/loader';
import type { GameState } from '../../core/state/schema';
import type { DialogueLine } from '../../ui/dialogue';
import type { MapTransitionRequest } from './mapTransitionPipeline';
import type { InterPrefectureLink, InterPrefectureLinkObjectSource } from './interPrefectureLink';
import { registerInterPrefectureMarker, syncInterPrefectureMarkers } from './interPrefectureMarker';
import { interactWithInterPrefectureLink, interPrefectureIsOpen } from './interPrefectureSceneFlow';

export interface PhaserInterPrefectureHost {
  busy: boolean;
  areaId(): string;
  content(): ContentIndex | undefined;
  gs(): GameState | undefined;
  devAll(): boolean;
  standStill(): void;
  root(name: 'travel'): HTMLDivElement;
  talk(lines: DialogueLine[]): Promise<void>;
  switchMap(request: MapTransitionRequest): void;
}

/** Phaser固有の県境マーカーとScene遷移だけをまとめ、Overworldを進行ルールから分離する。 */
export class PhaserInterPrefectureController {
  private readonly links = new Map<number, InterPrefectureLink>();
  private readonly icons = new Map<number, Phaser.GameObjects.Image>();

  constructor(private readonly host: Phaser.Scene & PhaserInterPrefectureHost) {}

  reset(): void {
    this.links.clear();
    this.icons.clear();
  }

  at(index: number): InterPrefectureLink | undefined {
    return this.links.get(index);
  }

  values(): IterableIterator<InterPrefectureLink> {
    return this.links.values();
  }

  entries(): IterableIterator<[number, InterPrefectureLink]> {
    return this.links.entries();
  }

  register(
    object: InterPrefectureLinkObjectSource,
    x: number,
    y: number,
    mapWidth: number,
    tileSize: number,
  ): void {
    registerInterPrefectureMarker({
      scene: this.host,
      currentArea: this.host.areaId(),
      object,
      tile: [x, y],
      mapWidth,
      tileSize,
      links: this.links,
      icons: this.icons,
      isOpen: (link) => this.isOpen(link),
    });
  }

  isOpen(link: InterPrefectureLink): boolean {
    const content = this.host.content();
    const game = this.host.gs();
    return content && game
      ? interPrefectureIsOpen(content.world, link, game.progress, this.host.devAll())
      : false;
  }

  sync(): void {
    syncInterPrefectureMarkers(this.links, this.icons, (link) => this.isOpen(link));
  }

  async enter(link: InterPrefectureLink): Promise<void> {
    if (this.host.busy) return;
    const content = this.host.content();
    const game = this.host.gs();
    if (!content || !game) return;
    this.host.busy = true;
    this.host.standStill();
    const destination = await interactWithInterPrefectureLink({
      world: content.world,
      link,
      progress: game.progress,
      devAll: this.host.devAll(),
      areas: content.areas,
      travelRoot: this.host.root('travel'),
      talk: (lines) => this.host.talk(lines),
    });
    if (destination)
      this.host.switchMap({
        targetMap: destination.targetMap,
        spawnName: destination.targetSpawn,
        interPrefectureArrival: true,
        reason: 'warp',
      });
    else this.host.busy = false;
  }
}
