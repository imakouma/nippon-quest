import { useEffect, useRef, useState } from 'preact/hooks';
import type { AccountPanelProps, AccountConfirmation, Operation } from './accountPanelTypes';
import { RubyLabel } from '../RubyLabel';
import { t } from '../i18n';
import { AccountAdventures } from './AccountAdventures';
import './account.css';

export function AccountPanel(props: AccountPanelProps) {
  const panel = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const restoreFocus = useRef<string | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const busy = operation !== null;
  const [error, setError] = useState(props.loginFailed ? t('account.loginFailed') : '');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState<AccountConfirmation | null>(null);
  useEffect(() => {
    if (confirmation) {
      panel.current?.querySelector<HTMLElement>('.nq-account-body')?.scrollTo(0, 0);
      panel.current?.querySelector<HTMLButtonElement>('.nq-account-cancel')?.focus();
    } else if (!busy && restoreFocus.current) {
      (panel.current?.querySelector<HTMLElement>(`#${restoreFocus.current}`) ?? panel.current)?.focus();
      restoreFocus.current = null;
    }
  }, [confirmation, busy]);
  useEffect(() => {
    if (error || message || operation)
      panel.current?.querySelector<HTMLElement>('.nq-account-body')?.scrollTo(0, 0);
  }, [error, message, operation]);
  const live = useRef({ confirmation, close: props.onClose });
  live.current = { confirmation, close: props.onClose };
  useEffect(() => {
    panel.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (!inFlight.current) {
          if (live.current.confirmation) setConfirmation(null);
          else live.current.close();
        }
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = controls[0],
        last = controls.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !controls.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, []);
  const confirm = (value: AccountConfirmation) => {
    restoreFocus.current = value.focusId;
    setError('');
    setMessage('');
    setConfirmation(value);
  };
  const run = async (kind: Operation, action: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setOperation(kind);
    setError('');
    setMessage('');
    setConfirmation(null);
    try {
      await action();
      if (['import', 'resolve'].includes(kind)) setMessage(t(`account.${kind}Done`));
    } catch {
      setError(t(`account.${kind}Failed`));
    } finally {
      inFlight.current = false;
      setOperation(null);
    }
  };
  const button = (kind: Operation, action: () => Promise<void>, disabled = false) => (
    <button
      type="button"
      disabled={busy || disabled}
      onClick={() => void run(kind, action)}
      class={kind === 'login' ? 'nq-account-primary' : undefined}
    >
      <RubyLabel
        text={t(
          kind === 'login'
            ? operation === 'login'
              ? 'account.loginWorking'
              : 'account.google'
            : `account.${kind}`,
        )}
      />
    </button>
  );
  const view = props.view;
  const unsettled = view.slots.some((slot) => slot.status !== 'synced');
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
          <div class="nq-account-actions">
            {view.userId && !view.blocked && (
              <button
                type="button"
                id="account-logout"
                disabled={busy || confirmation !== null}
                onClick={() =>
                  unsettled
                    ? confirm({
                        kind: 'logout',
                        text: t('account.logoutConfirm'),
                        run: props.onLogout,
                        focusId: 'account-logout',
                      })
                    : void run('logout', props.onLogout)
                }
              >
                <RubyLabel text={t('account.logout')} />
              </button>
            )}
            {!confirmation &&
              (view.blocked || !view.available || (!view.userId && !view.providers.includes('google'))) && (
                <button type="button" disabled={busy} onClick={props.onReload}>
                  <RubyLabel text={t('account.reload')} />
                </button>
              )}
            <button
              type="button"
              disabled={busy}
              onClick={() => (confirmation ? setConfirmation(null) : props.onClose())}
            >
              <RubyLabel text={t('account.close')} />
            </button>
          </div>
        </header>
        <div class="nq-account-body">
          {error && (
            <p role="alert" class="nq-account-feedback nq-account-error">
              <RubyLabel text={error} />
            </p>
          )}
          <div role="status" aria-live="polite" aria-atomic="true">
            {(busy || message) && (
              <p class="nq-account-feedback">
                <RubyLabel
                  text={
                    busy ? t(operation === 'login' ? 'account.loginWorking' : 'account.working') : message
                  }
                />
              </p>
            )}
          </div>
          {confirmation ? (
            <div class="nq-account-confirm">
              <h3>
                <RubyLabel text={t('account.confirmTitle')} />
              </h3>
              <p>
                <RubyLabel text={confirmation.text} />
              </p>
              <div class="nq-account-actions">
                <button type="button" class="nq-account-cancel" onClick={() => setConfirmation(null)}>
                  <RubyLabel text={t('account.cancel')} />
                </button>
                <button type="button" onClick={() => void run(confirmation.kind, confirmation.run)}>
                  <RubyLabel text={t('account.confirm')} />
                </button>
              </div>
            </div>
          ) : view.blocked ? (
            <>
              <p role="alert">
                <RubyLabel text={t('account.otherTab')} />
              </p>
              <p>
                <RubyLabel text={t('account.guestBlockedNote')} />
              </p>
              <button type="button" onClick={props.onUseGuest}>
                <RubyLabel text={t('account.guestBlockedAction')} />
              </button>
            </>
          ) : !view.userId ? (
            <>
              <section class="nq-account-signin" aria-labelledby="nq-account-signin-title">
                <h3 id="nq-account-signin-title">
                  <RubyLabel text={t('account.intro')} />
                </h3>
                {button(
                  'login',
                  () => props.onLogin('google'),
                  !view.available || !view.providers.includes('google'),
                )}
              </section>
              {view.available && view.providers.includes('google') && (
                <p class="nq-account-note">
                  <RubyLabel text={t('account.guest')} />
                </p>
              )}
            </>
          ) : (
            <>
              <AccountAdventures
                view={view}
                busy={busy}
                confirm={confirm}
                onImport={props.onImport}
                onResolve={props.onResolve}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
