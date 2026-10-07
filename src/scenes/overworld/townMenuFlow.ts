import { h, render } from 'preact';
import { TownOverlay, type TownOverlayProps } from '../../ui/field/TownOverlay';
import { playSfx } from '../../ui/sfx';

export type TownMenuViewFactory = () => Omit<TownOverlayProps, 'message' | 'focusKey' | 'onAct' | 'onClose'>;
export type TownMenuAction = (key: string) => string | null;

/** 町サービスの表示更新と終了処理。SceneにはDOM描画の詳細を漏らさない。 */
export function presentTownMenu(input: {
  root: HTMLElement;
  makeView: TownMenuViewFactory;
  act: TownMenuAction;
  onClose: () => void;
}): Promise<void> {
  return new Promise((resolve) => {
    const draw = (message: string | null, focusKey?: string) =>
      render(
        h(TownOverlay, {
          ...input.makeView(),
          message,
          focusKey,
          onAct: (key: string) => draw(input.act(key), key),
          onClose: () => {
            playSfx('back');
            render(null, input.root);
            input.onClose();
            resolve();
          },
        }),
        input.root,
      );
    draw(null);
  });
}
