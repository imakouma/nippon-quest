import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';

export type ContextActionKind = 'talk' | 'inspect' | 'open';

export interface ContextActionView {
  kind: ContextActionKind;
  label: string;
  onActivate: () => void;
}

const ICONS: Record<ContextActionKind, string> = {
  talk: 'role-talk',
  inspect: 'star',
  open: 'chest',
};

export function ContextActionButton({ action }: { action: ContextActionView | null }) {
  if (!action) return null;
  return (
    <button
      type="button"
      class="nq-win nq-context-action"
      aria-label={displayText(action.label)}
      aria-keyshortcuts="Enter Space Z"
      onClick={action.onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
        if (event.key.toLowerCase() !== 'z') return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) action.onActivate();
      }}
    >
      <PixelIcon name={ICONS[action.kind]} scale={4} />
      <RubyLabel text={action.label} />
    </button>
  );
}
