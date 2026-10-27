/** 対象を明示した小さな試作。未制作のキャラには既存表示を使う。 */
export function monsterAnimationSpec(id: string) {
  if (id !== 'aomori-ringoron') return undefined;
  return {
    key: 'mon.animation.aomori-ringoron.v1',
    path: 'sprites/animations/aomori-ringoron-v1.png',
    frameWidth: 128,
    frameHeight: 128,
    idle: [0, 1, 0, 3, 0, 2, 0],
    attack: [4, 5, 6, 7, 0],
  };
}
