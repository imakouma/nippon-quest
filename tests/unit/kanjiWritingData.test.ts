import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';

const valid = readFileSync('content/kanji/grade-2-strokes.json', 'utf8');
afterEach(() => vi.unstubAllGlobals());

it.each(['http', 'shape', 'missing-character', 'coordinates'])(
  'rejects %s data and permits a successful retry',
  async (failure) => {
    vi.resetModules();
    const broken = JSON.parse(valid);
    if (failure === 'missing-character') delete broken.characters['風'];
    if (failure === 'coordinates') broken.characters['風'][0].points[0] = [10001, 0];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(failure === 'shape' ? '{}' : JSON.stringify(broken), {
          status: failure === 'http' ? 503 : 200,
        }),
      )
      .mockResolvedValueOnce(new Response(valid));
    vi.stubGlobal('fetch', fetchMock);
    const { loadWriting } = await import('../../src/questions/renderers/kanji-trace/writingData');
    await expect(loadWriting('風')).rejects.toThrow();
    const restored = await loadWriting('風');
    expect(Object.keys(restored)).toHaveLength(160);
    expect(restored['風']).toHaveLength(9);
    expect(await loadWriting('刀')).toBe(restored);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  },
);
