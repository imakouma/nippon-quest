import type { BattleSummary } from '../../core/progression/battleResult';
import type { EncounterZone } from '../../core/battle/setup';
import type { Ground } from '../../core/world/ground';

/** Overworld から Battle Scene へ渡す、表示層間の安定した契約。 */
export interface BattleSceneData {
  enemyId: string;
  level: number;
  zone: EncounterZone;
  /** フィールドの地面。バトル背景の選択に使う。 */
  ground?: Ground;
  /** 中ボス・県ボス・地方ボス戦。 */
  isBoss?: boolean;
  /** 開発者モードではボス戦からも離脱できる。 */
  devMode?: boolean;
}

/** Battle Scene が終了時に通知する最小限の結果。 */
export interface BattleEndPayload {
  outcome: BattleSummary['outcome'];
  goldLost: number;
}
