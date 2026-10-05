/**
 * 効果音（Web Audio の矩形波・ノイズで合成するチップチューン風 SE）。
 * 音声ファイルが用意できたら assets/audio/se/<name>.mp3 に差し替える想定。キー名はここの SfxName と揃える。
 * 再生できない環境（AudioContext 非対応・自動再生制限）では黙って何もしない。
 */
export type SfxName =
  | 'blip'
  | 'move'
  | 'select'
  | 'back'
  | 'hit'
  | 'crit'
  | 'hurt'
  | 'heal'
  | 'buff'
  | 'miss'
  | 'ko'
  | 'run'
  | 'victory'
  | 'defeat'
  | 'combo'
  | 'encounter'
  | 'scan'
  | 'recruit'
  | 'discover'
  | 'stamp'
  | 'warp'
  | 'bump'
  | 'slash';

interface Note {
  f: number; // Hz（0 = ノイズ）
  d: number; // 秒
  at?: number; // 開始オフセット（秒）
  to?: number; // 終わりの周波数（スライド）
  type?: OscillatorType;
  g?: number; // 音量 0〜1
}

const N = (f: number, d: number, at = 0, extra: Partial<Note> = {}): Note => ({ f, d, at, ...extra });

const SOUNDS: Record<SfxName, Note[]> = {
  blip: [N(880, 0.03, 0, { g: 0.25 })],
  move: [N(660, 0.04, 0, { g: 0.4 })],
  select: [N(784, 0.05), N(1175, 0.08, 0.05)],
  back: [N(523, 0.05), N(392, 0.08, 0.05)],
  hit: [N(0, 0.12, 0, { g: 0.7 }), N(220, 0.1, 0, { to: 80, g: 0.5 })],
  crit: [N(0, 0.2, 0, { g: 0.9 }), N(440, 0.18, 0, { to: 60, g: 0.6 }), N(1568, 0.1, 0.12, { g: 0.4 })],
  hurt: [N(0, 0.15, 0, { g: 0.6 }), N(160, 0.15, 0, { to: 60, type: 'sawtooth', g: 0.4 })],
  heal: [N(523, 0.07), N(659, 0.07, 0.07), N(784, 0.07, 0.14), N(1047, 0.14, 0.21)],
  buff: [N(392, 0.08, 0, { to: 784 }), N(784, 0.1, 0.1, { to: 1175 })],
  miss: [N(330, 0.12, 0, { to: 220, type: 'triangle' })],
  ko: [N(0, 0.4, 0, { g: 0.5 }), N(600, 0.4, 0, { to: 40, g: 0.5 })],
  run: [N(200, 0.06, 0, { to: 600 }), N(250, 0.06, 0.08, { to: 700 }), N(300, 0.08, 0.16, { to: 900 })],
  victory: [
    N(523, 0.1),
    N(523, 0.1, 0.12),
    N(523, 0.1, 0.24),
    N(659, 0.3, 0.36),
    N(587, 0.12, 0.7),
    N(659, 0.12, 0.84),
    N(784, 0.45, 0.98),
  ],
  defeat: [
    N(392, 0.25, 0, { type: 'triangle' }),
    N(330, 0.25, 0.28, { type: 'triangle' }),
    N(262, 0.6, 0.56, { type: 'triangle' }),
  ],
  combo: [N(784, 0.06), N(988, 0.06, 0.06), N(1175, 0.06, 0.12), N(1568, 0.16, 0.18)],
  encounter: [
    N(220, 0.06),
    N(440, 0.06, 0.07),
    N(220, 0.06, 0.14),
    N(440, 0.06, 0.21),
    N(880, 0.25, 0.28, { to: 110 }),
  ],
  scan: [N(1200, 0.05), N(1500, 0.05, 0.08), N(1800, 0.05, 0.16), N(2400, 0.1, 0.24)],
  recruit: [N(659, 0.1), N(784, 0.1, 0.1), N(988, 0.1, 0.2), N(1319, 0.3, 0.3)],
  // 名所を見つけた（はっけん！のジングル）
  discover: [N(784, 0.08), N(988, 0.08, 0.09), N(1319, 0.08, 0.18), N(1568, 0.25, 0.27)],
  // スタンプを押す「ポン」
  stamp: [N(0, 0.05, 0, { g: 0.8 }), N(523, 0.05, 0.05), N(1047, 0.14, 0.1)],
  // ワープホール
  warp: [N(200, 0.6, 0, { to: 1600, type: 'triangle' }), N(400, 0.5, 0.12, { to: 2400, g: 0.3 })],
  // 壁にぶつかった
  bump: [N(110, 0.06, 0, { type: 'triangle', g: 0.6 })],
  // 剣のひと振り
  slash: [N(0, 0.08, 0, { g: 0.6 }), N(1800, 0.08, 0, { to: 300, type: 'sawtooth', g: 0.25 })],
};

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let volume = 0.5;
let muted = false;

export function setSfxVolume(v: number): void {
  volume = Math.min(1, Math.max(0, v));
}
export function setSfxMuted(m: boolean): void {
  muted = m;
}
export function isSfxMuted(): boolean {
  return muted;
}

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    // ノイズ用バッファは決定論的な LCG で作る（乱数直呼び禁止のため）
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let seed = 1234567;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      data[i] = (seed / 0x7fffffff) * 2 - 1;
    }
    noise = buf;
  } catch {
    ctx = null;
  }
  return ctx;
}

export function playSfx(name: SfxName): void {
  if (muted || volume <= 0) return;
  const a = audio();
  if (!a) return;
  if (a.state === 'suspended') void a.resume().catch(() => undefined);
  const t0 = a.currentTime + 0.01;
  for (const n of SOUNDS[name]) {
    const start = t0 + (n.at ?? 0);
    const gain = a.createGain();
    const peak = 0.12 * volume * (n.g ?? 0.5);
    gain.gain.setValueAtTime(peak, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
    gain.connect(a.destination);
    if (n.f === 0 && noise) {
      const src = a.createBufferSource();
      src.buffer = noise;
      src.connect(gain);
      src.start(start);
      src.stop(start + n.d);
    } else {
      const osc = a.createOscillator();
      osc.type = n.type ?? 'square';
      osc.frequency.setValueAtTime(n.f, start);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, start + n.d);
      osc.connect(gain);
      osc.start(start);
      osc.stop(start + n.d + 0.02);
    }
  }
}
