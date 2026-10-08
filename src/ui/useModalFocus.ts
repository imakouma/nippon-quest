import type { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';

const FOCUSABLE = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** モーダル内へフォーカスを移し、Tab を中に閉じ込め、閉じたら元へ戻す。 */
export function useModalFocus(root: RefObject<HTMLElement>, initialSelector?: string) {
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => {
      const target =
        (initialSelector === ':scope'
          ? root.current
          : initialSelector
            ? root.current?.querySelector<HTMLElement>(initialSelector)
            : null) ??
        root.current?.querySelector<HTMLElement>(FOCUSABLE) ??
        root.current;
      target?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !root.current) return;
      const controls = [...root.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (control) => control.getClientRects().length > 0,
      );
      if (!controls.length) {
        event.preventDefault();
        root.current.focus();
        return;
      }
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [initialSelector, root]);
}
