import { describe, expect, it } from 'vitest';
import { auditTohokuAssetsRights } from '../../scripts/audit-tohoku-assets-rights';

describe('東北公開素材の権利監査', () => {
  it('すべての配布素材を台帳で一意に分類し、未確認素材をGOにしない', async () => {
    const report = await auditTohokuAssetsRights();
    expect(report.uncovered).toEqual([]);
    expect(report.multiplyCovered).toEqual([]);
    expect(report.missingDeclared).toEqual([]);
    expect(report.hashMismatches).toEqual([]);
    expect(report.invalidApprovals).toEqual([]);
    expect(report.decision).toBe('NO-GO');
    expect(report.counts.holdMedia).toBeGreaterThan(0);
  });

  it('音声未収録を明示し、読み上げフォールバックを検出する', async () => {
    const report = await auditTohokuAssetsRights();
    expect(report.counts.audioFiles).toBe(0);
    expect(report.runtime.speechFallbackPresent).toBe(true);
    expect(report.runtime.audioPolicy).toContain('Web Speech');
  });
});
