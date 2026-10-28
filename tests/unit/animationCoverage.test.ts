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
    expect(byState('reference-ready')).toHaveLength(89);
  });

  it('records portable production metadata for every pending runtime monster', () => {
    const report = loadReport();
    const pending = report.entries.filter((entry) => entry.state === 'reference-ready');

    for (const entry of pending) {
      expect(entry.kind, entry.id).toBe('runtime-monster');
      expect(entry.contentPath, entry.id).toBe(`content/monsters/${entry.id}.json`);
      expect(existsSync(entry.contentPath!), entry.id).toBe(true);
      for (const reference of [entry.pixelReference, entry.turnaroundReference]) {
        expect(reference?.path, entry.id).toMatch(/^assets\/cinematics\/monsters\/.+\.png$/);
        expect(reference?.sha256, entry.id).toMatch(/^[a-f0-9]{64}$/);
      }
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
