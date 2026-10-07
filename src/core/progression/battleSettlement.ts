/** バトル結果をバッグ編成まで反映する純粋な後処理。Scene は通知の表示だけを担当する。 */
import type { ContentIndex } from '../content/loader';
import { heroLevel, type AppliedBattle } from './battleResult';
import { bagCapacity, bagContext, stowNewMonster } from './bag';

export interface BattleSettlement {
  state: AppliedBattle['state'];
  level: { before: number; after: number; bagCapacity: number; bagGrew: boolean };
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
  const capacity = bagCapacity(after, content.settings.bag);
  return {
    state,
    level: {
      before,
      after,
      bagCapacity: capacity,
      bagGrew: capacity > bagCapacity(before, content.settings.bag),
    },
    recruitStored,
  };
}
