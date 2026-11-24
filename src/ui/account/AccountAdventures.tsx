import type { AccountPanelProps, AccountConfirmation } from './accountPanelTypes';
import { RubyLabel } from '../RubyLabel';
import { t } from '../i18n';

type Props = Pick<AccountPanelProps, 'view' | 'onImport' | 'onResolve'> & {
  busy: boolean;
  confirm(value: AccountConfirmation): void;
};
export function AccountAdventures({ view, busy, confirm, onImport, onResolve }: Props) {
  const importFirst = !view.slots.some((slot) => slot.local);
  const guestSaves = view.guestSlots.length > 0 && (
    <section class="nq-account-import">
      <h3>
        <RubyLabel text={t('account.importTitle')} />
      </h3>
      <p class="nq-account-note">
        <RubyLabel text={t('account.importHint')} />
      </p>
      {view.guestSlots.map((slot) => (
        <div class="nq-account-slot" key={slot.slot}>
          <h4>
            <RubyLabel text={t('saveSlots.slot', { n: slot.slot })} />
          </h4>
          <p>
            <RubyLabel text={slot.label} />
          </p>
          <button
            type="button"
            id={`account-import-${slot.slot}`}
            disabled={busy}
            onClick={() =>
              confirm({
                kind: 'import',
                focusId: `account-import-${slot.slot}`,
                text: t('account.importConfirm', {
                  guest: slot.label,
                  cloud: view.slots.find((s) => s.slot === slot.slot)?.local ?? t('account.empty'),
                }),
                run: () => onImport(slot.slot),
              })
            }
          >
            <RubyLabel text={t('account.import')} />
          </button>
        </div>
      ))}
    </section>
  );
  return (
    <>
      {importFirst && guestSaves}
      <h3>
        <RubyLabel text={t('account.adventures')} />
      </h3>
      {view.slots.map((slot) => (
        <section key={slot.slot} class={`nq-account-slot nq-account-slot-${slot.status}`}>
          <div class="nq-account-slot-heading">
            <h4>
              <RubyLabel text={t('saveSlots.slot', { n: slot.slot })} />
            </h4>
            <span class={`nq-account-badge nq-account-badge-${slot.status}`}>
              <RubyLabel
                text={t(
                  `account.${!slot.local && slot.status === 'synced' ? 'emptyBadge' : slot.status + 'Badge'}`,
                )}
              />
            </span>
          </div>
          <p>
            <RubyLabel text={slot.local ?? t('account.empty')} />
          </p>
          {slot.status === 'pending' && (
            <p class="nq-account-note">
              <RubyLabel text={t('account.pending')} />
            </p>
          )}
          {slot.status === 'conflict' && (
            <>
              <p class="nq-account-note">
                <RubyLabel text={t('account.conflict')} />
              </p>
              <p>
                <RubyLabel text={t('account.cloudVersion', { detail: slot.cloud ?? t('account.deleted') })} />
              </p>
              <div class="nq-account-actions">
                {(['local', 'cloud'] as const).map((choice) => (
                  <button
                    type="button"
                    key={choice}
                    id={`account-resolve-${slot.slot}-${choice}`}
                    disabled={busy}
                    onClick={() =>
                      confirm({
                        kind: 'resolve',
                        focusId: `account-resolve-${slot.slot}-${choice}`,
                        text: t('account.resolveConfirm', {
                          chosen: (choice === 'local' ? slot.local : slot.cloud) ?? t('account.deleted'),
                          replaced: (choice === 'local' ? slot.cloud : slot.local) ?? t('account.deleted'),
                        }),
                        run: () => onResolve(slot.slot, choice),
                      })
                    }
                  >
                    <RubyLabel text={t(choice === 'local' ? 'account.keepLocal' : 'account.keepCloud')} />
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      ))}
      {!importFirst && guestSaves}
    </>
  );
}
