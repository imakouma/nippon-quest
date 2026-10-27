export interface MonsterAnimationSpec {
  id: string;
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  idle: number[];
  attack: number[];
}

// 各作業チャットは自分のmanifestだけ更新する。共通の再生実装への競合を避ける。
const batches = import.meta.glob<MonsterAnimationSpec[]>(
  '../../assets/sprites/animations/batch-*/manifest.json',
  { eager: true, import: 'default' },
);
const specs = new Map<string, MonsterAnimationSpec>();
for (const entries of Object.values(batches)) {
  for (const spec of entries) {
    if (spec.id === 'aomori-ringoron' || specs.has(spec.id))
      throw new Error(`Duplicate monster animation: ${spec.id}`);
    specs.set(spec.id, spec);
  }
}

/** 制作済みだけ有効にし、未制作のキャラには既存表示を使う。 */
export function monsterAnimationSpec(id: string) {
  if (id !== 'aomori-ringoron') return specs.get(id);
  return {
    key: 'mon.animation.aomori-ringoron.v1',
    path: 'sprites/animations/aomori-ringoron-v1.png',
    frameWidth: 128,
    frameHeight: 128,
    idle: [0, 1, 0, 3, 0, 2, 0],
    attack: [4, 5, 6, 7, 0],
  };
}
