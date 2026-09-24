/**
 * 決定論的シャッフル（シード付き。ふつうの乱数は 使わない）。
 * 同じ問題が 毎回 同じ並びに ならないよう、呼ぶ側が「問題 id と 時刻」などを 種にする。
 */
export function shuffleIds(ids: string[], seedStr: string): string[] {
  let h = 2166136261;
  for (const ch of seedStr) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const j = (h >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
