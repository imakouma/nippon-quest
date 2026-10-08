/** バトル結果をバッグ編成まで反映する純粋な後処理。Scene は通知の表示だけを担当する。 */
import type { ContentIndex } from '../content/loader';
import { heroLevel, levelForXp, type AppliedBattle } from './battleResult';
import { bagCapacity, bagContext, stowNewMonster } from './bag';

export interface BattleSettlement {
  state: AppliedBattle['state'];
  level: { before: number; after: number; bagCapacity: number; bagGrew: boolean };
  monsterLevelUps: { uid: string; before: number; after: number }[];
  recruitStored: boolean;
}

export function settleBattleBag(
  previous: AppliedBattle['state'],
  applied: AppliedBattle,
  content: Pick<ContentIndex, 'xp' | 'settings' | 'monsters'>,
): BattleSettlement {
  const before = heroLevel(previous, content.xp.hero);
  const after = heroLevel(applied.state, content.xp.hero);
  let state = applied.state;
  let recruitStored = false;
  if (applied.newMonsterUid) {
    const stow = stowNewMonster(state, applied.newMonsterUid, bagContext(state, content));
    state = stow.state;
    recruitStored = !stow.inBag;
  }
  if (state.player.level !== after) {
    state = { ...state, player: { ...state.player, level: after } };
  }
  const monsterLevelUps: BattleSettlement['monsterLevelUps'] = [];
  const leveledMonsters = state.party.owned.map((monster) => {
    const level = Math.max(monster.level, levelForXp(content.xp.monster, monster.xp));
    if (level > monster.level)
      monsterLevelUps.push({ uid: monster.uid, before: monster.level, after: level });
    return level === monster.level ? monster : { ...monster, level };
  });
  if (leveledMonsters.some((monster, index) => monster !== state.party.owned[index])) {
    state = { ...state, party: { ...state.party, owned: leveledMonsters } };
  }
  const capacity = bagCapacity(after, content.settings.bag);
  return {
    state,
    level: {
      before,
      after,
      bagCapacity: capacity,
      bagGrew: capacity > bagCapacity(before, content.settings.bag),
    },
    monsterLevelUps,
    recruitStored,
  };
}
