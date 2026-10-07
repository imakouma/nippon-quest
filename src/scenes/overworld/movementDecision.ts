/** フィールド移動で何を起こすかの優先順。Scene は結果を実行するだけにする。 */
export type MovementDecision<TBoss, TGate> =
  | { kind: 'stand' }
  | { kind: 'midboss' }
  | { kind: 'regionBoss'; boss: TBoss }
  | { kind: 'lockedGate'; gate: TGate }
  | { kind: 'areaBoss' }
  | { kind: 'lastBoss' }
  | { kind: 'blocked' }
  | { kind: 'move'; x: number; y: number };

export function movementDecision<TBoss, TGate>(input: {
  from: [number, number];
  delta: [number, number];
  inside(x: number, y: number): boolean;
  indexOf(x: number, y: number): number;
  midBossTile: number | null;
  regionBossAt(index: number): TBoss | undefined;
  gateAt(index: number): TGate | undefined;
  gateOpen(gate: TGate): boolean;
  areaBossTile: number | null;
  lastBossTile: number | null;
  blocked(x: number, y: number): boolean;
}): MovementDecision<TBoss, TGate> {
  const x = input.from[0] + input.delta[0];
  const y = input.from[1] + input.delta[1];
  if (!input.inside(x, y)) return { kind: 'stand' };
  const index = input.indexOf(x, y);
  if (input.midBossTile === index) return { kind: 'midboss' };
  const regionBoss = input.regionBossAt(index);
  if (regionBoss) return { kind: 'regionBoss', boss: regionBoss };
  const gate = input.gateAt(index);
  if (gate && !input.gateOpen(gate)) return { kind: 'lockedGate', gate };
  if (input.areaBossTile === index) return { kind: 'areaBoss' };
  if (input.lastBossTile === index) return { kind: 'lastBoss' };
  if (input.blocked(x, y)) return { kind: 'blocked' };
  return { kind: 'move', x, y };
}
