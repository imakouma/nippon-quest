import { h, render } from 'preact';
import { DialogueOverlay, type DialogueLine } from '../../ui/dialogue';

/** 会話オーバーレイを表示し、閉じたあとに選択番号を返す。 */
export function presentDialogue(
  root: HTMLElement,
  lines: DialogueLine[],
  choices: string[] | undefined,
  afterClose: () => void,
): Promise<number> {
  return new Promise((resolve) => {
    render(
      h(DialogueOverlay, {
        lines,
        choices,
        onComplete: (choice: number) => {
          render(null, root);
          afterClose();
          resolve(choice);
        },
      }),
      root,
    );
  });
}
