import { h, render } from 'preact';
import { InterPrefectureTravelOverlay } from '../../ui/field/InterPrefectureTravelOverlay';
import type { InterPrefectureLink } from './interPrefectureLink';
import { interPrefectureTravelPresentation } from './interPrefectureTravelPresentation';

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** 実在交通の確認・移動・取消を表示し、横断してよいかだけを Scene へ返す。 */
export function presentInterPrefectureTravel(
  root: HTMLElement,
  link: InterPrefectureLink,
  translate: Translate,
): Promise<boolean> {
  const presentation = interPrefectureTravelPresentation(link, translate);
  if (!presentation) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (accepted: boolean) => {
      render(null, root);
      resolve(accepted);
    };
    render(
      h(InterPrefectureTravelOverlay, {
        presentation,
        onComplete: () => finish(true),
        onCancel: () => finish(false),
      }),
      root,
    );
  });
}
