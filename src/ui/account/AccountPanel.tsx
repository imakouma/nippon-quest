import { useEffect, useRef, useState } from 'preact/hooks';
import type { AccountView, LoginProvider } from '../../shared/account';
import { RubyLabel } from '../RubyLabel';
import { t } from '../i18n';
import './account.css';

export interface AccountPanelProps {
  view: AccountView;
  onLogin(provider: LoginProvider): Promise<void>;
  onLogout(): Promise<void>;
  onImport(slot: 1 | 2 | 3): Promise<void>;
  onResolve(slot: 1 | 2 | 3, choice: 'local' | 'cloud'): Promise<void>;
  onSync(): Promise<void>;
  onExport(): Promise<void>;
  onDelete(): Promise<void>;
  onClose(): void;
  onReload(): void;
  loginFailed?: boolean;
}
export function AccountPanel(props: AccountPanelProps) {
  const panel = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(props.loginFailed ? t('account.loginFailed') : '');
  const [confirmation, setConfirmation] = useState<{ text: string; run: () => Promise<void> } | null>(null);
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('.nq-account-body')?.scrollTo(0, 0);
    if (confirmation) panel.current?.querySelector<HTMLButtonElement>('.nq-account-confirm button')?.focus();
  }, [confirmation]);
  const live = useRef({ busy, close: props.onClose });
  live.current = { busy, close: props.onClose };
  useEffect(() => {
    panel.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !live.current.busy) {
        event.preventDefault();
        live.current.close();
      }
      if (event.key !== 'Tab') return;
      const buttons = Array.from(
        panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
      );
      const first = buttons[0],
        last = buttons.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setConfirmation(null);
    try {
      await action();
    } catch {
      setError(t('account.failed'));
    } finally {
      setBusy(false);
    }
  };
  const button = (key: string, action: () => Promise<void>, disabled = false) => (
    <button type="button" disabled={busy || disabled} onClick={() => void run(action)}>
      <RubyLabel text={t(key)} />
    </button>
  );
  const view = props.view;
  return (
    <div class="nq-account-backdrop">
      <div
        ref={panel}
        class="nq-win nq-account"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nq-account-title"
        tabIndex={-1}
        aria-busy={busy}
      >
        <header>
          <h2 id="nq-account-title">
            <RubyLabel text={t('account.title')} />
          </h2>
          <button type="button" disabled={busy} onClick={props.onClose}>
            <RubyLabel text={t('account.close')} />
          </button>
        </header>
        <div class="nq-account-body">
          {!view.available && (
            <p role="status">
              <RubyLabel text={t('account.unavailable')} />
            </p>
          )}
          {confirmation ? (
            <div role="alert" class="nq-account-confirm">
              <p>
                <RubyLabel text={confirmation.text} />
              </p>
              <div class="nq-account-actions">
                {button('account.confirm', confirmation.run)}
                <button type="button" onClick={() => setConfirmation(null)}>
                  <RubyLabel text={t('account.cancel')} />
                </button>
              </div>
            </div>
          ) : view.blocked ? (
            <>
              <p role="alert">
                <RubyLabel text={t('account.otherTab')} />
              </p>
              <button type="button" onClick={props.onReload}>
                <RubyLabel text={t('account.reload')} />
              </button>
            </>
          ) : !view.userId ? (
            <>
              <p>
                <RubyLabel text={t('account.intro')} />
              </p>
              <p class="nq-account-note">
                <RubyLabel text={t('account.privacy')} />
              </p>
              <div class="nq-account-actions">
                {button('account.line', () => props.onLogin('line'), !view.providers.includes('line'))}
                {button('account.google', () => props.onLogin('google'), !view.providers.includes('google'))}
              </div>
              <p>
                <RubyLabel text={t('account.guest')} />
              </p>
            </>
          ) : (
            <>
              <p>
                <RubyLabel text={t('account.connected')} />
              </p>
              <div class="nq-account-actions">
                {button('account.sync', props.onSync)}
                {button('account.export', props.onExport)}
                {button('account.logout', props.onLogout)}
              </div>
              <p class="nq-account-note">
                <RubyLabel text={t('account.logoutNote')} />
              </p>
              {view.slots.map((slot) => (
                <section key={slot.slot} class="nq-account-slot">
                  <h3>
                    <RubyLabel text={t('saveSlots.slot', { n: slot.slot })} />
                  </h3>
                  <p>
                    <RubyLabel text={slot.local ?? t('account.empty')} />
                  </p>
                  <p role="status">
                    <RubyLabel text={t(`account.${slot.status}`)} />
                  </p>
                  {slot.status === 'conflict' && (
                    <>
                      <p>
                        <RubyLabel
                          text={t('account.cloudVersion', { detail: slot.cloud ?? t('account.deleted') })}
                        />
                      </p>
                      <div class="nq-account-actions">
                        {button('account.keepLocal', () => props.onResolve(slot.slot, 'local'))}
                        {button('account.keepCloud', () => props.onResolve(slot.slot, 'cloud'))}
                      </div>
                    </>
                  )}
                </section>
              ))}
              {view.guestSlots.length > 0 && (
                <section>
                  <h3>
                    <RubyLabel text={t('account.importTitle')} />
                  </h3>
                  {view.guestSlots.map((slot) => (
                    <div class="nq-account-slot" key={slot.slot}>
                      <p>
                        <RubyLabel text={t('saveSlots.slot', { n: slot.slot })} /> —{' '}
                        <RubyLabel text={slot.label} />
                      </p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setConfirmation({
                            text: t('account.importConfirm', {
                              guest: slot.label,
                              cloud:
                                view.slots.find((s) => s.slot === slot.slot)?.local ?? t('account.empty'),
                            }),
                            run: () => props.onImport(slot.slot),
                          })
                        }
                      >
                        <RubyLabel text={t('account.import')} />
                      </button>
                    </div>
                  ))}
                </section>
              )}
              <button
                class="nq-account-delete"
                type="button"
                disabled={busy}
                onClick={() => setConfirmation({ text: t('account.deleteConfirm'), run: props.onDelete })}
              >
                <RubyLabel text={t('account.delete')} />
              </button>
            </>
          )}
          {busy && (
            <p role="status">
              <RubyLabel text={t('account.working')} />
            </p>
          )}
          {error && (
            <p role="alert">
              <RubyLabel text={error} />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
