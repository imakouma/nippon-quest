import { useEffect, useRef } from 'preact/hooks';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { useModalFocus } from '../useModalFocus';
import { HeroSkillEditor, type HeroSkillEditorProps } from './HeroSkillEditor';
import './menu.css';

export function HeroSkillScreen(props: HeroSkillEditorProps & { onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  useModalFocus(root);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        props.onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props.onClose]);
  return (
    <div class="nq-wmap" onClick={props.onClose}>
      <div
        ref={root}
        class="nq-win nq-wmap-box nq-menu-box nq-hero-skill-window"
        role="dialog"
        aria-modal="true"
        aria-label={t('field.skillLoadoutTitle')}
        tabindex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div class="nq-menu-head">
          <RubyLabel text={t('field.skillLoadoutTitle')} class="nq-menu-title" />
          <button type="button" class="nq-back nq-menu-close" onClick={props.onClose}>
            ← {t('ui.back')}
          </button>
        </div>
        <HeroSkillEditor {...props} />
      </div>
    </div>
  );
}
