import { describe, expect, it } from 'vitest';
import {
  oceanFrameForPhase,
  oceanPhaseAt,
  oceanTextureTile,
} from '../../src/rendering/overworld/oceanMotion';

describe('ocean motion', () => {
  it('changes frames and loops across all sixteen frames', () => {
    expect(oceanFrameForPhase(0, 0)).toBe(0);
    expect(oceanFrameForPhase(1, 0)).toBe(1);
    expect(oceanFrameForPhase(16, 0)).toBe(0);
    expect(oceanFrameForPhase(15, 2)).toBe(1);
  });
  it('uses eight stable phases across the water, including shore tiles', () => {
    expect(new Set(Array.from({ length: 8 }, (_, i) => oceanPhaseAt(i * 3, 0))).size).toBe(8);
    expect(oceanTextureTile(0, 12, 9)).toBe(oceanPhaseAt(12, 9));
    expect(oceanTextureTile(15, 12, 9)).toBe(oceanPhaseAt(12, 9));
    expect(oceanTextureTile(16, 12, 9)).toBe(oceanPhaseAt(12, 9));
    expect(oceanTextureTile(17, 12, 9)).toBe(17);
  });
});
