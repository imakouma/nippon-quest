/**
 * バトルの結果を GameState に反映する（GDD §4.5〜4.6）。純粋関数。
 * - 勝利: 経験値・ゴールド・ドロップ・撃破カウンタ
 * - 仲間化: パーティに追加
 * - 敗北: ゴールドを settings.defeatGoldLossRate だけ失い、HP/MP 全快（宿屋に戻る扱い）。装備・仲間は失わない
 * - 図鑑: 出会ったモンスターを登録
 * レベルアップ（ステータスの伸び）は Step 7 の progression で扱う。ここでは xp を足すだけ。
 */
import type { Settings } from '../content/schemas';
import type { GameState } from '../state/schema';

export interface BattleSummary {
  outcome: 'victory' | 'defeat' | 'fled' | 'recruited';
  enemyRefId: string;
  enemyLevel: number;
  heroHp: number;
  heroMp: number;
  heroMaxHp: number;
  heroMaxMp: number;
  xp: number;
  gold: number;
  drops: string[];
  /** 戦闘後の手持ちどうぐ（使ったぶん減っている） */
  items: Record<string, number>;
  /** 勝利後の「なかまにする？」で はい を選んだか */
  recruitAccepted: boolean;
  /** 教科ごとの「かんぺき」回数（ミッション perfect:<subject>:<n> 用） */
  perfectBySubject: Record<string, number>;
}

export interface AppliedBattle {
  state: GameState;
  goldLost: number;
  newMonsterUid: string | null;
}

const bump = (rec: Record<string, number>, key: string, n = 1) => {
  rec[key] = (rec[key] ?? 0) + n;
};

export function applyBattleResult(
  prev: GameState,
  r: BattleSummary,
  settings: Pick<Settings, 'defeatGoldLossRate'>,
  now = Date.now(),
): AppliedBattle {
  const gs = structuredClone(prev);
  let goldLost = 0;
  let newMonsterUid: string | null = null;

  if (!gs.dex.monsters.includes(r.enemyRefId)) gs.dex.monsters.push(r.enemyRefId);
  gs.inventory = { ...gs.inventory, ...r.items };
  for (const [subject, n] of Object.entries(r.perfectBySubject))
    bump(gs.progress.counters, `perfect:${subject}`, n);

  if (r.outcome === 'defeat') {
    goldLost = Math.floor(gs.player.gold * settings.defeatGoldLossRate);
    gs.player.gold -= goldLost;
    gs.player.hp = r.heroMaxHp;
    gs.player.mp = r.heroMaxMp;
  } else {
    gs.player.hp = Math.max(1, Math.min(r.heroMaxHp, r.heroHp));
    gs.player.mp = Math.max(0, Math.min(r.heroMaxMp, r.heroMp));
  }

  if (r.outcome === 'victory') {
    gs.player.xp += r.xp;
    gs.player.gold += r.gold;
    for (const id of r.drops) bump(gs.inventory, id);
    bump(gs.progress.counters, `defeat:${r.enemyRefId}`);
  }

  if (r.outcome === 'recruited' || (r.outcome === 'victory' && r.recruitAccepted)) {
    let n = gs.party.owned.length + 1;
    while (gs.party.owned.some((o) => o.uid === `${r.enemyRefId}#${n}`)) n++;
    newMonsterUid = `${r.enemyRefId}#${n}`;
    // バッグに 入れるかは マスしだい（progression/bag.ts の stowNewMonster を Battle が よぶ）。ここでは あずけるだけ
    gs.party.owned.push({ uid: newMonsterUid, monsterId: r.enemyRefId, level: r.enemyLevel, xp: 0 });
    bump(gs.progress.counters, `recruit:${r.enemyRefId}`);
  }

  gs.updatedAt = now;
  return { state: gs, goldLost, newMonsterUid };
}

/** 次のレベルまでの残り経験値。xp.json は「index = Lv-1 に到達するのに必要な累積 XP」として読む */
export function xpToNextLevel(table: number[], level: number, xp: number): { need: number; ratio: number } {
  const cur = table[level - 1] ?? 0;
  const next = table[level];
  if (next === undefined) return { need: 0, ratio: 1 };
  const span = Math.max(1, next - cur);
  return { need: Math.max(0, next - xp), ratio: Math.min(1, Math.max(0, (xp - cur) / span)) };
}

/** けいけんち から きまる レベル（xp.json の 表で、xp が とどいている いちばん 上の レベル） */
export function levelForXp(table: readonly number[], xp: number): number {
  let lv = 1;
  while (table[lv] !== undefined && xp >= table[lv]!) lv++;
  return lv;
}

/**
 * 主人公の レベル（バッグの マス・「つぎの レベルまで」の 表示）。
 * レベルアップの ステータスの のびは まだ 無く player.level は 1 の ままなので、けいけんち から きまる レベルと 大きいほう。
 * 出てくる 敵の レベルは player.level の まま（主人公が 強く ならないうちに 敵だけ 強く ならないように）
 */
export function heroLevel(gs: GameState, table: readonly number[]): number {
  return Math.max(gs.player.level, levelForXp(table, gs.player.xp));
}
