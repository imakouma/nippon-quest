import type { BattleSummary } from '../../core/progression/battleResult';
import type { EncounterZone } from '../../core/encounter/contentAdapter';
import type { BattleRulesetId } from '../../core/battle/ruleset';
import type { Party } from '../../core/battle/types';
import type { Ground } from '../../core/world/ground';
import type { QuestionQuery } from '../../questions/contracts';
import type { BattlePresentation } from './layout';

/** Overworld から Battle Scene へ渡す、表示層間の安定した契約。 */
export type EncounterSource =
  | { type: 'random' }
  | { type: 'mid-boss' }
  | { type: 'area-boss' }
  | { type: 'last-boss' }
  | { type: 'region-boss'; regionId: string }
  | { type: 'island-boss'; islandId: string }
  | { type: 'arena'; opponentId: string }
  | { type: 'script' };

interface BattleSceneBase {
  enemyId: string;
  level: number;
  zone: EncounterZone;
  /** フィールドの地面。バトル背景の選択に使う。 */
  ground?: Ground;
  /** 中ボス・県ボス・地方ボス戦。 */
  isBoss?: boolean;
  /** 開発者モードではボス戦からも離脱できる。 */
  devMode?: boolean;
  /** E2Eで報酬画面と仲間加入演出を確実に確認する。 */
  forceRecruitOffer?: boolean;
  /** 比較確認用の戦闘画面配置。省略時は正式仕様の奥行きビュー。 */
  presentation?: BattlePresentation;
}

type ScriptedQuestionQueries = readonly [QuestionQuery, ...QuestionQuery[]];

export type PersistentBattleSceneData = BattleSceneBase & {
  kind?: Exclude<BattleRulesetId, 'tutorial'>;
  party?: never;
  scriptedQuestions?: never;
};

export type TutorialBattleSceneData = BattleSceneBase & {
  kind: 'tutorial';
  party: Party;
  scriptedQuestions: ScriptedQuestionQueries;
};

export type BattleSceneData = PersistentBattleSceneData | TutorialBattleSceneData;

export type BattleLaunchData = BattleSceneData & {
  encounterId: string;
  encounterSource: EncounterSource;
};

/** Battle Scene が終了時に通知する最小限の結果。 */
export interface BattleEndPayload {
  outcome: BattleSummary['outcome'];
  goldLost: number;
}

export interface BattleEndEvent {
  encounterId: string;
  result: BattleEndPayload;
}
