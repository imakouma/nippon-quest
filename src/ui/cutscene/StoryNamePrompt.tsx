import { useState } from 'preact/hooks';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import './cutscene.css';

export function StoryNamePrompt({ onDecide }: { onDecide: (name: string) => void }) {
  const [name, setName] = useState('');
  const clean = name.trim();
  return (
    <section class="nq-story-name" aria-label={t('field.prologueNameTitle')}>
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
          autofocus
          aria-label={t('newGame.name')}
          maxlength={6}
          value={name}
          placeholder={t('newGame.namePlaceholder')}
          onInput={(event) => setName((event.target as HTMLInputElement).value)}
        />
        <button type="submit" disabled={!clean}>
          {t('field.prologueNameDecide')}
        </button>
      </form>
    </section>
  );
}
