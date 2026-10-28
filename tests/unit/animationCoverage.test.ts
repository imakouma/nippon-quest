import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import evolutionReferences from '../../assets/sprites/animations/batch-01/evolution-references.json';
import runtimeManifest from '../../assets/sprites/animations/batch-01/manifest.json';
import assignments from '../../tasks/animation-batch-assignments.json';

type CoverageState =
  | 'existing-runtime'
  | 'produced-runtime'
  | 'produced-character-reference'
  | 'produced-visual-only'
  | 'reference-ready';

interface ReferenceMetadata {
  path: string;
  sha256: string;
}

interface CoverageEntry {
  id: string;
  kind: 'runtime-monster' | 'named-character' | 'visual-only-evolution';
  state: CoverageState;
  contentPath?: string;
  animationPath?: string;
  pixelReference?: ReferenceMetadata;
  turnaroundReference?: ReferenceMetadata;
}

interface CoverageReport {
  batch: string;
  entries: CoverageEntry[];
}

const reportPath = 'docs/verification/animation-completion/coverage.json';
const batch = assignments.batches.find((entry) => entry.batch === 'batch-01')!;

function loadReport(): CoverageReport {
  expect(existsSync(reportPath), `${reportPath} must be generated`).toBe(true);
  return JSON.parse(readFileSync(reportPath, 'utf8')) as CoverageReport;
}

describe('animation completion coverage', () => {
  it('classifies every assigned ID exactly once', () => {
    const report = loadReport();
    const ids = report.entries.map((entry) => entry.id);

    expect(report.batch).toBe('batch-01');
    expect(ids).toHaveLength(111);
    expect(new Set(ids).size).toBe(111);
    expect([...ids].sort()).toEqual([...batch.ids].sort());
  });

  it('preserves the approved completion boundaries', () => {
    const report = loadReport();
    const byState = (state: CoverageState) => report.entries.filter((entry) => entry.state === state);

    expect(
      byState('produced-runtime')
        .map((entry) => entry.id)
        .sort(),
    ).toEqual(runtimeManifest.map((entry) => entry.id).sort());
    expect(byState('existing-runtime').map((entry) => entry.id)).toEqual(['aomori-ringoron']);
    expect(
      byState('produced-character-reference')
        .map((entry) => entry.id)
        .sort(),
    ).toEqual(['michiru', 'protagonist', 'shiori']);
    expect(
      byState('produced-visual-only')
        .map((entry) => entry.id)
        .sort(),
    ).toEqual(evolutionReferences.map((entry) => entry.id).sort());
    expect(byState('produced-runtime')).toHaveLength(101);
    expect(byState('reference-ready')).toHaveLength(0);
  });

  it('records an existing animation asset for every produced runtime monster', () => {
    const report = loadReport();
    const produced = report.entries.filter((entry) => entry.state === 'produced-runtime');

    for (const entry of produced) {
      expect(entry.kind, entry.id).toBe('runtime-monster');
      expect(entry.animationPath, entry.id).toBe(`sprites/animations/batch-01/${entry.id}-v1.png`);
      expect(existsSync(`assets/${entry.animationPath}`), entry.id).toBe(true);
    }
  });

  it('keeps people, visual-only evolutions, and Ringoron out of batch runtime registrations', () => {
    const report = loadReport();
    const registered = new Set(runtimeManifest.map((entry) => entry.id));

    for (const entry of report.entries) {
      if (entry.kind !== 'runtime-monster' || entry.state === 'existing-runtime')
        expect(registered.has(entry.id), entry.id).toBe(false);
    }
  });
});
