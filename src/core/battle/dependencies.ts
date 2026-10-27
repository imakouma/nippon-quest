import type { ElementTable, Item, Monster, Settings, Skill } from '../content/schemas';

/** バトル計算へ注入する content 定義。core の action resolver と engine が共有する。 */
export interface BattleDeps {
  settings: Settings;
  elements: ElementTable;
  skills: Map<string, Skill>;
  items: Map<string, Item>;
  monsters: Map<string, Monster>;
}
