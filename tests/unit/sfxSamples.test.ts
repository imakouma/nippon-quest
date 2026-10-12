import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sources: { start: ReturnType<typeof vi.fn>; buffer?: unknown; connect: ReturnType<typeof vi.fn> }[] =
  [];
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
    return { gain: { value: 0 }, connect: vi.fn() };
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
});
