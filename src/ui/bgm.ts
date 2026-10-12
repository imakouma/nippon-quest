const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export type MusicTrack =
  'title' | 'field' | 'town' | 'dungeon' | 'secret' | 'battle' | 'boss' | 'victory' | 'defeat';
export interface MusicSession {
  change(track: MusicTrack): void;
  setVolume(volume: number): void;
  stop(): void;
}
interface Request {
  track: MusicTrack;
  volume: number;
}
interface Sound {
  audio: HTMLAudioElement;
  ended: boolean;
}
const clamp = (volume: number) => (Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0);

export function createMusicDirector() {
  const requests: Request[] = [];
  const sounds = new Map<MusicTrack, Sound>();
  let current: Sound | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let retry: (() => void) | null = null;
  let revision = 0;

  function clearRetry(): void {
    if (retry && typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', retry);
      document.removeEventListener('keydown', retry);
    }
    retry = null;
  }

  function fade(sound: Sound, volume: number, done: () => void): void {
    const from = sound.audio.volume;
    let step = 0;
    timer = setInterval(() => {
      sound.audio.volume = clamp(from + (volume - from) * (++step / 8));
      if (step < 8) return;
      if (timer) clearInterval(timer);
      timer = null;
      done();
    }, 20);
  }

  function play(sound: Sound, version: number): void {
    const rejected = (error: unknown) => {
      if (version !== revision || current !== sound || typeof document === 'undefined') return;
      // ファイル欠損やデコード失敗は操作ごとに再試行しない。
      if (!(error instanceof Error) || error.name !== 'NotAllowedError') return;
      clearRetry();
      retry = () => {
        clearRetry();
        play(sound, version);
      };
      document.addEventListener('pointerdown', retry, { once: true });
      document.addEventListener('keydown', retry, { once: true });
    };
    try {
      void sound.audio
        .play()
        .then(() => {
          // 遅れて許可された再生が、終了済みの曲を復活させない。
          if (version !== revision && current !== sound) sound.audio.pause();
        })
        .catch(rejected);
    } catch (error) {
      rejected(error);
    }
  }

  function sync(): void {
    const version = ++revision;
    if (timer) clearInterval(timer);
    timer = null;
    clearRetry();
    const request = requests.at(-1);
    let next: Sound | null = null;
    if (request && request.volume > 0 && typeof Audio !== 'undefined') {
      next = sounds.get(request.track) ?? null;
      if (!next) {
        try {
          const audio = new Audio(`${base}/assets/audio/bgm/${request.track}-theme.mp3`);
          audio.loop = request.track !== 'victory' && request.track !== 'defeat';
          audio.preload = 'auto';
          next = { audio, ended: false };
          const sound = next;
          audio.addEventListener('ended', () => {
            sound.ended = true;
          });
          sounds.set(request.track, sound);
        } catch {
          next = null;
        }
      }
    }
    const activate = () => {
      current = next;
      if (!next || next.ended) return;
      next.audio.volume = 0;
      play(next, version);
      fade(next, request!.volume, () => undefined);
    };
    if (current === next) {
      if (next) next.audio.volume = request!.volume;
      // 切替フェード中に同曲を再要求した場合も再生を回復する。
      if (next?.audio.paused && !next.ended) play(next, version);
      return;
    }
    if (current) {
      const previous = current;
      fade(previous, 0, () => {
        previous.audio.pause();
        activate();
      });
    } else activate();
  }

  return {
    start(track: MusicTrack, volume: number): MusicSession {
      const request = { track, volume: clamp(volume) };
      // 新しい戦闘・結果の曲は先頭から。探索曲はマップ移動後も続きを使う。
      const cached = sounds.get(track);
      if (cached && ['battle', 'boss', 'victory', 'defeat'].includes(track)) {
        cached.ended = false;
        try {
          cached.audio.currentTime = 0;
        } catch {
          /* 未読込の音源は既に先頭。 */
        }
      }
      requests.push(request);
      sync();
      let stopped = false;
      return {
        change(nextTrack) {
          if (stopped || request.track === nextTrack) return;
          request.track = nextTrack;
          const sound = sounds.get(nextTrack);
          if (sound && !sound.audio.loop) {
            sound.ended = false;
            try {
              sound.audio.currentTime = 0;
            } catch {
              /* 未読込の音源は既に先頭。 */
            }
          }
          if (requests.at(-1) === request) sync();
        },
        setVolume(nextVolume) {
          const normalized = clamp(nextVolume);
          if (stopped || request.volume === normalized) return;
          request.volume = normalized;
          if (requests.at(-1) === request) sync();
        },
        stop() {
          if (stopped) return;
          stopped = true;
          const wasTop = requests.at(-1) === request;
          requests.splice(requests.indexOf(request), 1);
          if (wasTop) sync();
        },
      };
    },
  };
}

export const music = createMusicDirector();
