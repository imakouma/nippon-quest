import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sources: { start: ReturnType<typeof vi.fn>; buffer?: unknown; connect: ReturnType<typeof vi.fn> }[] =
  [];
const oscillatorStarts: unknown[] = [];
class FakeAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = {};
  createBuffer() {
    return { getChannelData: () => new Float32Array(22050) };
  }
  decodeAudioData = vi.fn(async () => ({ duration: 0.15 }));
  resume = vi.fn(async () => undefined);
  createGain() {
    return {
      gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
  }
  createOscillator() {
    return {
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: () => oscillatorStarts.push(true),
      stop: vi.fn(),
    };
  }
  createBufferSource() {
    const source = { buffer: undefined, start: vi.fn(), connect: vi.fn() };
    sources.push(source);
    return source;
  }
}

describe('ファイル効果音', () => {
  beforeEach(() => {
    vi.resetModules();
    sources.length = 0;
    oscillatorStarts.length = 0;
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('先読み済みの足音を繰り返しても毎歩fetchせず、音量0で鳴らさない', async () => {
    const sfx = await import('../../src/ui/sfx');
    await sfx.preloadFieldSfx();
    expect(fetch).toHaveBeenCalledTimes(6);
    sfx.playSfx('step-grass');
    sfx.playSfx('step-grass');
    expect(fetch).toHaveBeenCalledTimes(6);
    expect(sources).toHaveLength(2);
    sfx.setSfxVolume(0);
    sfx.playSfx('step-grass');
    expect(sources).toHaveLength(2);
  });

  it('読込中に頼まれた足音を、完了後に遅れて鳴らさない', async () => {
    let complete!: (response: unknown) => void;
    const pending = new Promise((resolve) => {
      complete = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => pending),
    );
    const sfx = await import('../../src/ui/sfx');
    sfx.playSfx('step-grass');
    complete({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
    await sfx.preloadFieldSfx();
    expect(sources).toHaveLength(0);
  });

  it('音源が取得できない場合も、再生要求は例外を投げない', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false })),
    );
    const sfx = await import('../../src/ui/sfx');
    await expect(sfx.preloadFieldSfx()).resolves.toBeUndefined();
    expect(() => sfx.playSfx('door')).not.toThrow();
    expect(sources).toHaveLength(0);
  });

  it('ミュート中は足音を鳴らさず、解除すると次の一歩から再開する', async () => {
    const sfx = await import('../../src/ui/sfx');
    await sfx.preloadFieldSfx();
    sfx.setSfxMuted(true);
    sfx.playSfx('step-stone');
    expect(sources).toHaveLength(0);
    sfx.setSfxMuted(false);
    sfx.playSfx('step-stone');
    expect(sources).toHaveLength(1);
  });

  it('戦闘用5音源だけを準備し、繰り返し再生や再入場で再取得しない', async () => {
    const sfx = await import('../../src/ui/sfx');
    await sfx.prepareBattleSfx(0.8);
    expect(fetch).toHaveBeenCalledTimes(5);
    expect(
      vi
        .mocked(fetch)
        .mock.calls.map(([url]) => String(url).split('/').at(-1))
        .sort(),
    ).toEqual(['slash.mp3', 'hit.mp3', 'crit.mp3', 'hurt.mp3', 'heal.mp3'].sort());
    for (const sound of ['slash', 'hit', 'crit', 'hurt', 'heal'] as const) sfx.playSfx(sound);
    expect(sources).toHaveLength(5);
    expect(oscillatorStarts).toHaveLength(0);
    await sfx.prepareBattleSfx(0.8);
    expect(fetch).toHaveBeenCalledTimes(5);
    sfx.setSfxVolume(0);
    sfx.playSfx('heal');
    expect(sources).toHaveLength(5);
  });

  it('戦闘音源の取得に失敗しても、既存の合成回復音は鳴る', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false })),
    );
    const sfx = await import('../../src/ui/sfx');
    await sfx.prepareBattleSfx(0.8);
    expect(() => sfx.playSfx('heal')).not.toThrow();
    expect(oscillatorStarts).toHaveLength(4);
    expect(sources).toHaveLength(0);
  });
});
