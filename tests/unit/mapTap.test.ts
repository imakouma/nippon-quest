import { describe, expect, it } from 'vitest';
import { mapTapScore } from '../../src/questions/renderers/map-tap/schema';
describe('map-tap', () =>
  it('正解点の半径内だけを正解にする', () => {
    const p = {
      prompt: 'p',
      image: 'x.png',
      hotspots: [
        { x: 20, y: 30, label: 'a' },
        { x: 80, y: 70, label: 'b' },
      ],
      answerIndex: 0,
      radius: 9,
    };
    expect(mapTapScore(p, 24, 34)).toBe(1);
    expect(mapTapScore(p, 80, 70)).toBe(0);
  }));
