/**
 * Canvas の上に DOM オーバーレイを重ね、canvas と同じ矩形・同じ拡大率に追従させる。
 * 文章はすべてこちら側で描く（ふりがな・読み上げ・タッチ操作のため／docs/01 §5）。
 */
export const STAGE_W = 960;
export const STAGE_H = 540;

export function attachOverlay(gameRoot: HTMLElement, layer: HTMLElement): () => void {
  const sync = () => {
    const canvas = gameRoot.querySelector('canvas');
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const scale = r.width / STAGE_W;
    layer.style.left = `${r.left}px`;
    layer.style.top = `${r.top}px`;
    layer.style.transform = `scale(${scale})`;
  };
  const ro = new ResizeObserver(sync);
  ro.observe(gameRoot);
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', sync);
  const id = setInterval(sync, 500); // canvas 生成直後の取りこぼし対策
  sync();
  return () => {
    ro.disconnect();
    window.removeEventListener('resize', sync);
    window.removeEventListener('orientationchange', sync);
    clearInterval(id);
  };
}

/** 英語だけの 文（英単語・アルファベット）は 英語の 声で、それ以外は 日本語の 声で 読む */
export const speechLang = (text: string): 'en-US' | 'ja-JP' =>
  /[A-Za-z]/.test(text) && /^[\x20-\x7E]+$/.test(text) ? 'en-US' : 'ja-JP';

/** 読み上げ（Web Speech API）。低学年向け。使えない環境では黙って何もしない */
export function createSpeaker(): (text: string) => void {
  return (text: string) => {
    try {
      const s = window.speechSynthesis;
      if (!s) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = speechLang(text);
      u.rate = u.lang === 'en-US' ? 0.8 : 0.95;
      s.cancel();
      s.speak(u);
    } catch {
      /* 読み上げ非対応環境は無視 */
    }
  };
}
