import type Phaser from 'phaser';
import { interPrefectureIconKey } from '../../rendering/overworld/entranceIcons';
import {
  parseInterPrefectureLinkObject,
  type InterPrefectureLink,
  type InterPrefectureLinkObjectSource,
} from './interPrefectureLink';

/** 生成済み入口を Scene の索引とフィールド上の種類別ドット絵へ登録する。 */
export function registerInterPrefectureMarker(input: {
  scene: Phaser.Scene;
  currentArea: string;
  object: InterPrefectureLinkObjectSource;
  tile: [number, number];
  mapWidth: number;
  tileSize: number;
  links: Map<number, InterPrefectureLink>;
  icons: Map<number, Phaser.GameObjects.Image>;
  isOpen(link: InterPrefectureLink): boolean;
}): void {
  const link = parseInterPrefectureLinkObject(input.currentArea, input.object);
  if (!link) return;
  const [x, y] = input.tile;
  const index = y * input.mapWidth + x;
  input.links.set(index, link);
  const icon = input.scene.add
    .image(
      x * input.tileSize + input.tileSize / 2,
      y * input.tileSize + input.tileSize / 2,
      interPrefectureIconKey(link, input.isOpen(link)),
    )
    .setDepth(y * input.tileSize + 4);
  input.icons.set(index, icon);
}

/** 進行変更直後に、全入口の開閉ドット絵を現在の解放表へ同期する。 */
export function syncInterPrefectureMarkers(
  links: ReadonlyMap<number, InterPrefectureLink>,
  icons: ReadonlyMap<number, Phaser.GameObjects.Image>,
  isOpen: (link: InterPrefectureLink) => boolean,
): void {
  for (const [tile, link] of links) icons.get(tile)?.setTexture(interPrefectureIconKey(link, isOpen(link)));
}
