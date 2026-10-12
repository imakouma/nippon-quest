type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
};

function isInstalledApp(): boolean {
  return (
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && navigator.standalone === true)
  );
}

async function enterMobileFullscreen(): Promise<void> {
  if (document.fullscreenElement || isInstalledApp()) return;
  if (navigator.maxTouchPoints < 1 || !document.documentElement.requestFullscreen) return;

  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    const orientation = screen.orientation as LockableOrientation | undefined;
    await orientation?.lock?.('landscape').catch(() => undefined);
  } catch {
    // 端末やアプリ内ブラウザが拒否した場合も、通常表示のままゲームを続けられる。
  }
}

/** スマホの最初の操作をユーザー操作として使い、ブラウザ枠を隠せる端末では全画面にする。 */
export function enableMobileFullscreen(): () => void {
  const onFirstInteraction = (): void => {
    void enterMobileFullscreen();
  };
  document.addEventListener('pointerup', onFirstInteraction, { once: true, passive: true });
  return () => document.removeEventListener('pointerup', onFirstInteraction);
}

/** 本番版をホーム画面へ追加できるようにする。開発中はキャッシュ干渉を避ける。 */
export function registerAppServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener(
    'load',
    () => {
      void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
        console.warn('[pwa] Service Workerを登録できませんでした', error);
      });
    },
    { once: true },
  );
}
