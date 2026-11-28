import { h, render } from 'preact';
import { AccountPanel } from '../../ui/account/AccountPanel';
import { t } from '../../ui/i18n';
import type { AccountView } from '../../shared/account';
import {
  accountSession,
  signIn,
  signOut,
  subscribeAccount,
  useGuestWhileBlocked,
} from '../../core/state/accountSession';
import { accountDetails, guestSummaries, importGuestSlot, resolveAccountSlot } from '../../core/state/save';
import type { GameState } from '../../core/state/schema';

/** 初回読み込みの上限時間。応答がない場合はタイトルへ戻して操作できる状態にする */
const ACCOUNT_LOAD_TIMEOUT_MS = 15_000;

function describe(state: GameState | null) {
  return state
    ? t('account.adventure', {
        name: state.player.name,
        level: state.player.level,
        date: new Date(state.updatedAt).toLocaleString('ja-JP'),
      })
    : null;
}
export function mountAccountPanel(
  root: HTMLElement,
  close: () => void,
  directLoginFailed = false,
): () => void {
  let disposed = false;
  let sequence = 0;
  const url = new URL(location.href);
  const loginFailed = directLoginFailed || url.searchParams.has('error');
  for (const key of ['account', 'error', 'error_description']) url.searchParams.delete(key);
  history.replaceState(null, '', url);
  const refresh = async () => {
    const request = ++sequence;
    const session = accountSession();
    const [details, guests] = await Promise.all([accountDetails(), guestSummaries()]);
    if (disposed || request !== sequence) return;
    const view: AccountView = {
      userId: session.saves?.owner ?? null,
      providers: session.providers,
      available: session.available,
      blocked: session.blocked,
      slots: details.map((slot) => ({
        slot: slot.slot,
        local: describe(slot.state),
        cloud: slot.remote === undefined ? undefined : describe(slot.remote),
        status: slot.status,
      })),
      guestSlots: guests
        .filter((slot) => slot.exists)
        .map((slot) => ({
          slot: slot.slot,
          label: t('account.adventure', {
            name: slot.name ?? '',
            level: slot.level ?? 1,
            date: new Date(slot.updatedAt ?? 0).toLocaleString('ja-JP'),
          }),
        })),
    };
    render(
      h(AccountPanel, {
        view,
        loginFailed,
        onClose: close,
        onReload: () => {
          const retryUrl = new URL(location.href);
          retryUrl.searchParams.set('account', '1');
          history.replaceState(null, '', retryUrl);
          location.reload();
        },
        onUseGuest: () => {
          useGuestWhileBlocked();
          close();
        },
        onLogin: async (provider) => {
          location.assign(await signIn(provider));
        },
        onLogout: async () => {
          await signOut();
          location.assign('/');
        },
        onImport: async (slot) => {
          await importGuestSlot(slot, true);
          await refresh();
        },
        onResolve: async (slot, choice) => {
          await resolveAccountSlot(slot, choice);
          await refresh();
        },
      }),
      root,
    );
  };
  const unsubscribe = subscribeAccount(() => {
    void refresh().catch(() => {});
  });
  // 読み込みが終わらないと何も描画されず、閉じることもできない。
  // 失敗時と同じく、上限時間を過ぎたらタイトルへ戻す。
  void Promise.race([
    refresh(),
    new Promise<never>((_resolve, reject) => {
      setTimeout(
        () => reject(new Error('アカウント情報の読み込みが時間切れになりました')),
        ACCOUNT_LOAD_TIMEOUT_MS,
      );
    }),
  ]).catch(() => {
    if (!disposed) close();
  });
  return () => {
    disposed = true;
    unsubscribe();
  };
}
