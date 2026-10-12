import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMusicDirector, type MusicTrack } from '../../src/ui/bgm';

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  static rejectNext = false;
  currentTime = 0;
  loop = false;
  preload = '';
  volume = 1;
  paused = true;
  play = vi.fn(() => {
    if (FakeAudio.rejectNext) {
      FakeAudio.rejectNext = false;
      return Promise.reject(new DOMException('autoplay blocked', 'NotAllowedError'));
    }
    this.paused = false;
    return Promise.resolve();
  });
  pause = vi.fn(() => (this.paused = true));
  constructor(readonly src: string) {
    super();
    FakeAudio.instances.push(this);
  }
}

describe('場面別BGM', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('document', new EventTarget());
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    FakeAudio.instances = [];
    FakeAudio.rejectNext = false;
  });
  const settle = () => vi.advanceTimersByTime(1000);

  it.each<MusicTrack>(['title', 'field', 'town', 'dungeon', 'secret', 'battle', 'boss', 'victory', 'defeat'])(
    '%sの音源を選び、勝敗ジングルだけループしない',
    (track) => {
      const session = createMusicDirector().start(track, 0.6);
      settle();
      const audio = FakeAudio.instances[0]!;
      expect(audio.src).toMatch(new RegExp(`/assets/audio/bgm/${track}-theme\\.mp3$`));
      expect(audio.loop).toBe(!['victory', 'defeat'].includes(track));
      expect(audio.volume).toBeCloseTo(0.6);
      expect(audio.paused).toBe(false);
      session.stop();
      settle();
      expect(audio.paused).toBe(true);
    },
  );

  it('戦闘終了で探索曲を中断位置から復帰し、二重再生しない', () => {
    const music = createMusicDirector();
    music.start('field', 0.6);
    settle();
    const field = FakeAudio.instances[0]!;
    field.currentTime = 23;
    const battle = music.start('battle', 0.6);
    settle();
    expect(field.paused).toBe(true);
    expect(FakeAudio.instances[1]!.paused).toBe(false);
    battle.stop();
    settle();
    expect(field.paused).toBe(false);
    expect(field.currentTime).toBe(23);
    expect(FakeAudio.instances[1]!.paused).toBe(true);
  });

  it('同じ曲の要求とマップ移動で再生位置を維持する', () => {
    const music = createMusicDirector();
    const first = music.start('field', 0.6);
    settle();
    const field = FakeAudio.instances[0]!;
    field.currentTime = 17;
    first.change('field');
    first.stop();
    music.start('field', 0.6);
    settle();
    expect(FakeAudio.instances).toHaveLength(1);
    expect(field.currentTime).toBe(17);
    expect(field.paused).toBe(false);
  });

  it('勝利確定で戦闘曲を止め、結果画面ではジングルを繰り返さない', () => {
    const music = createMusicDirector();
    music.start('field', 0.6);
    const battle = music.start('boss', 0.6);
    settle();
    battle.change('victory');
    settle();
    const victory = FakeAudio.instances.find((a) => a.src.includes('victory'))!;
    expect(FakeAudio.instances.filter((a) => !a.paused)).toEqual([victory]);
    victory.pause();
    victory.dispatchEvent(new Event('ended'));
    battle.setVolume(0.4);
    settle();
    expect(victory.play).toHaveBeenCalledOnce();
    expect(FakeAudio.instances.every((a) => a.paused)).toBe(true);
    battle.stop();
    settle();
    expect(FakeAudio.instances[0]!.paused).toBe(false);
  });

  it('音量0では生成せず、音量変更は再生中の曲へすぐ反映する', () => {
    const session = createMusicDirector().start('town', 0);
    settle();
    expect(FakeAudio.instances).toHaveLength(0);
    session.setVolume(2);
    settle();
    const town = FakeAudio.instances[0]!;
    expect(town.volume).toBe(1);
    session.setVolume(0.25);
    expect(town.volume).toBe(0.25);
    session.setVolume(0);
    settle();
    expect(town.paused).toBe(true);
  });

  it('終了した背景Sceneからの停止が新しい曲を止めない', () => {
    const music = createMusicDirector();
    const field = music.start('field', 0.6);
    const battle = music.start('battle', 0.6);
    settle();
    field.stop();
    field.stop();
    settle();
    expect(FakeAudio.instances.find((a) => a.src.includes('battle'))!.paused).toBe(false);
    battle.stop();
  });

  it('自動再生制限は次の操作で再試行し、終了後は再試行しない', async () => {
    FakeAudio.rejectNext = true;
    const session = createMusicDirector().start('title', 0.6);
    await Promise.resolve();
    await Promise.resolve();
    document.dispatchEvent(new Event('pointerdown'));
    settle();
    expect(FakeAudio.instances[0]!.paused).toBe(false);
    session.stop();
    settle();
    document.dispatchEvent(new Event('keydown'));
    expect(FakeAudio.instances[0]!.play).toHaveBeenCalledTimes(2);
  });

  it('Audio API不在・生成失敗でも進行を妨げない', () => {
    vi.stubGlobal('Audio', undefined);
    expect(() => createMusicDirector().start('field', 0.6).stop()).not.toThrow();
    vi.stubGlobal(
      'Audio',
      class {
        constructor() {
          throw new Error('no device');
        }
      },
    );
    expect(() => createMusicDirector().start('field', 0.6).stop()).not.toThrow();
  });
});
