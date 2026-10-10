import { useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { useModalFocus } from '../useModalFocus';
import './cutscene.css';

export function StoryNamePrompt({ onDecide }: { onDecide: (name: string) => void }) {
  const [name, setName] = useState('');
  const promptRef = useRef<HTMLElement>(null);
  const clean = name.trim();
  useModalFocus(promptRef, 'input');
  return (
    <section
      ref={promptRef}
      class="nq-story-name"
      role="dialog"
      aria-modal="true"
      aria-label={displayText(t('field.prologueNameTitle'))}
      tabIndex={-1}
    >
      <form
        class="nq-win nq-story-name-box"
        onSubmit={(event) => {
          event.preventDefault();
          if (clean) onDecide(clean);
        }}
      >
        <RubyLabel text={t('field.prologueFairy')} class="nq-story-name-speaker" />
        <RubyLabel text={t('field.prologueAskName')} class="nq-story-name-question" as="p" />
        <input
          aria-label={t('newGame.name')}
          aria-describedby={!clean ? 'nq-story-name-required' : undefined}
          maxlength={6}
          value={name}
          placeholder={t('newGame.namePlaceholder')}
          onInput={(event) => setName((event.target as HTMLInputElement).value)}
        />
        {!clean && (
          <p id="nq-story-name-required" class="nq-story-name-hint" role="status">
            {t('field.prologueNameRequired')}
          </p>
        )}
        <button
          type="submit"
          disabled={!clean}
          aria-describedby={!clean ? 'nq-story-name-required' : undefined}
        >
          {t('field.prologueNameDecide')}
        </button>
      </form>
    </section>
  );
}
