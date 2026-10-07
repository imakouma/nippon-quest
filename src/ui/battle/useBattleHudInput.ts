import { useEffect, useRef } from 'preact/hooks';
import { playSfx } from '../sfx';
import type { HudState, HudStore } from './store';

const COLS = 2;
const CMD_COLS = 2;
const KEY_DIR: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

interface Option {
  key?: string;
  disabled: boolean;
  action(): void;
}

function menuOptions(state: HudState, store: HudStore): Option[] {
  switch (state.menu) {
    case 'commands':
      return state.commands.map((command) => ({
        disabled: command.disabled,
        action: () => store.dispatch({ t: 'command', kind: command.kind }),
      }));
    case 'skills':
      return state.skills.map((skill) => ({
        disabled: skill.disabled,
        action: () => store.dispatch({ t: 'skill', key: skill.key }),
      }));
    case 'items':
      return state.items.map((item) => ({
        disabled: item.count <= 0,
        action: () => store.dispatch({ t: 'item', id: item.id }),
      }));
    case 'swap':
      return state.swaps.map((swap) => ({
        disabled: swap.disabled,
        action: () => store.dispatch({ t: 'swap', index: swap.index }),
      }));
    case 'none':
      return [];
  }
}

export function pickBattleHudOption(option: Option | undefined): void {
  if (!option) return;
  if (option.disabled) return void playSfx('miss');
  playSfx('select');
  option.action();
}

/** BattleHud のキーボード操作を Scene/UI表示から切り離す。 */
export function useBattleHudInput(store: HudStore, advance: () => void): void {
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const state = store.get();
      if (state.question) return;
      const key = event.key;
      const ok = key === 'Enter' || key === 'z' || key === 'Z' || key === ' ';
      const back = key === 'Escape' || key === 'x' || key === 'X' || key === 'Backspace';
      const direction = KEY_DIR[key];
      if (!ok && !back && !direction) return;
      event.preventDefault();
      if (state.result) {
        if (state.result.recruitName) {
          if (direction && direction[0] !== 0) {
            playSfx('move');
            store.set({ cursor: state.cursor === 0 ? 1 : 0 });
          } else if (ok) {
            playSfx('select');
            store.dispatch({ t: 'recruitAnswer', yes: state.cursor === 0 });
          }
        } else if (ok) {
          playSfx('select');
          store.dispatch({ t: 'resultClose' });
        }
        return;
      }
      if (state.menu !== 'none') {
        const options = menuOptions(state, store);
        if (direction && options.length) {
          const next = Math.max(
            0,
            Math.min(
              options.length - 1,
              state.cursor + direction[0] + direction[1] * (state.menu === 'commands' ? CMD_COLS : COLS),
            ),
          );
          if (next !== state.cursor) {
            playSfx('move');
            store.set({ cursor: next });
          }
        } else if (ok) pickBattleHudOption(options[state.cursor]);
        else if (back && state.menu !== 'commands') {
          playSfx('back');
          store.dispatch({ t: 'back' });
        }
        return;
      }
      if (ok) advanceRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);
}
