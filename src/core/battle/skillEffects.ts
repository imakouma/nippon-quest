import type { Rng } from '../rng';

export function skillHits(accuracy: number, rng: Rng): boolean {
  if (accuracy <= 0) return false;
  if (accuracy >= 100) return true;
  return rng.chance(accuracy / 100);
}
