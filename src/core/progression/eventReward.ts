/**
 * 名所イベントの報酬（GDD §7）。score → rewardByScore の段 → GameState に反映。純粋関数のみ。
 * 文言は持たない。何を手に入れたか（RewardLine）だけ返し、画面側が ja.json の field.reward* で文にする。
 */
import type { Reward } from '../content/schemas';
import type { GameState } from '../state/schema';
import { areaBossFlag } from './route';

export interface RewardTier {
  min: number;
  reward: Reward;
}

/** score 以下でいちばん高い段の報酬。どれにも届かなければいちばん低い段（score 0 でも必ず何かもらえる） */
export function pickReward(tiers: readonly RewardTier[], score: number): Reward {
  const sorted = [...tiers].sort((a, b) => b.min - a.min);
  return (sorted.find((t) => score >= t.min) ?? sorted[sorted.length - 1])?.reward ?? {};
}

export type RewardLine =
  | { kind: 'xp' | 'gold'; n: number }
  | { kind: 'item'; id: string; n: number }
  | { kind: 'skill' | 'recipe' | 'title'; id: string }
  | { kind: 'monster' };

export function applyReward(
  prev: GameState,
  r: Reward,
  now = Date.now(),
): { state: GameState; lines: RewardLine[] } {
  const gs = structuredClone(prev);
  const lines: RewardLine[] = [];
  if (r.xp) {
    gs.player.xp += r.xp;
    lines.push({ kind: 'xp', n: r.xp });
  }
  if (r.gold) {
    gs.player.gold += r.gold;
    lines.push({ kind: 'gold', n: r.gold });
  }
  for (const it of r.items ?? []) {
    const n = it.n ?? 1;
    gs.inventory[it.itemId] = (gs.inventory[it.itemId] ?? 0) + n;
    if (!gs.dex.items.includes(it.itemId)) gs.dex.items.push(it.itemId);
    lines.push({ kind: 'item', id: it.itemId, n });
  }
  for (const s of r.skills ?? []) {
    if (gs.player.skills.includes(s)) continue;
    gs.player.skills.push(s);
    lines.push({ kind: 'skill', id: s });
  }
  for (const rc of r.recipes ?? []) {
    if (gs.progress.unlockedRecipes.includes(rc)) continue;
    gs.progress.unlockedRecipes.push(rc);
    lines.push({ kind: 'recipe', id: rc });
  }
  let unlockedMonster = false;
  for (const monsterId of r.unlockMonsters ?? []) {
    if (gs.progress.unlockedMonsters.includes(monsterId)) continue;
    gs.progress.unlockedMonsters.push(monsterId);
    unlockedMonster = true;
  }
  if (unlockedMonster) lines.push({ kind: 'monster' });
  if (r.title && !gs.progress.titles.includes(r.title)) {
    gs.progress.titles.push(r.title);
    lines.push({ kind: 'title', id: r.title });
  }
  gs.updatedAt = now;
  return { state: gs, lines };
}

/**
 * イベント・名所を「おわった」ことにする。
 *  - eventId: チャレンジを終えたイベント（progress.eventsDone）。★ 看板が金色になり、once のイベントは二度と自動では始まらない
 *  - stamp:   名所スタンプ（dex.motifs）
 *  - flag:    中ボス撃破などのしるし（progress.eventsDone）
 */
export function markDone(
  prev: GameState,
  o: { eventId?: string; stamp?: string; flag?: string },
  now = Date.now(),
): GameState {
  const gs = structuredClone(prev);
  for (const id of [o.eventId, o.flag])
    if (id && !gs.progress.eventsDone.includes(id)) gs.progress.eventsDone.push(id);
  if (o.stamp && !gs.dex.motifs.includes(o.stamp)) gs.dex.motifs.push(o.stamp);
  gs.updatedAt = now;
  return gs;
}

/** 県ボスを倒した：「県のしるし」（progress.areaSigns）を もらい、ボスを倒した しるし（eventsDone）を つける */
export function earnAreaSign(prev: GameState, areaId: string, now = Date.now()): GameState {
  const gs = markDone(prev, { flag: areaBossFlag(areaId) }, now);
  if (!gs.progress.areaSigns.includes(areaId)) gs.progress.areaSigns.push(areaId);
  return gs;
}
