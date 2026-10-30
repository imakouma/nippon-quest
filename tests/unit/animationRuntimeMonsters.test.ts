import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import characterManifest from '../../assets/sprites/animations/batch-01/characters.json';
import evolutionManifest from '../../assets/sprites/animations/batch-01/evolution-references.json';
import runtimeManifest from '../../assets/sprites/animations/batch-01/manifest.json';
import assignments from '../../tasks/animation-batch-assignments.json';

interface ReferenceMetadata {
  path: string;
  sha256: string;
}

interface PendingProductionEntry {
  id: string;
  state: 'pending' | 'accepted';
  pixelReference: ReferenceMetadata;
  turnaroundReference: ReferenceMetadata;
  prompt?: string;
  generatedSource?: ReferenceMetadata;
  runtimeOutput?: ReferenceMetadata;
  visualReview?: {
    fullSize: boolean;
    isolatedCells: boolean;
    reviewedAt: string;
  };
}

interface ProductionLedger {
  schemaVersion: number;
  batch: string;
  baselineRuntimeIds: string[];
  entries: PendingProductionEntry[];
}

const ledgerPath = 'docs/verification/animation-completion/runtime-monsters/production-ledger.json';
const batch = assignments.batches.find((entry) => entry.batch === 'batch-01')!;

function loadLedger(): ProductionLedger {
  expect(existsSync(ledgerPath), `${ledgerPath} must be initialized before production`).toBe(true);
  if (!existsSync(ledgerPath)) throw new Error(`${ledgerPath} is missing`);
  return JSON.parse(readFileSync(ledgerPath, 'utf8')) as ProductionLedger;
}

describe('runtime monster animation production', () => {
  it('locks the approved 89-ID production target without omissions or overlaps', () => {
    const ledger = loadLedger();
    const targetIds = ledger.entries.map((entry) => entry.id);
    const classified = [
      ...ledger.baselineRuntimeIds,
      ...targetIds,
      'aomori-ringoron',
      ...characterManifest.map((entry) => entry.id),
      ...evolutionManifest.map((entry) => entry.id),
    ];

    expect(ledger.schemaVersion).toBe(1);
    expect(ledger.batch).toBe('batch-01');
    expect(ledger.baselineRuntimeIds).toHaveLength(12);
    expect(targetIds).toHaveLength(89);
    expect(new Set(classified).size).toBe(111);
    expect([...classified].sort()).toEqual([...batch.ids].sort());
  });

  it('keeps adopted source hashes attached to every production target', () => {
    const ledger = loadLedger();

    for (const entry of ledger.entries) {
      expect(entry.pixelReference.path, entry.id).toMatch(/^assets\/cinematics\/monsters\/.+\.png$/);
      expect(entry.turnaroundReference.path, entry.id).toMatch(/^assets\/cinematics\/monsters\/.+\.png$/);
      expect(entry.pixelReference.sha256, entry.id).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.turnaroundReference.sha256, entry.id).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('registers only entries with complete accepted evidence', () => {
    const ledger = loadLedger();
    const registered = new Set(runtimeManifest.map((entry) => entry.id));

    for (const entry of ledger.entries) {
      if (entry.state === 'pending') {
        expect(registered.has(entry.id), entry.id).toBe(false);
        continue;
      }

      expect(registered.has(entry.id), entry.id).toBe(true);
      expect(entry.prompt?.trim().length, entry.id).toBeGreaterThan(200);
      expect(entry.generatedSource?.path, entry.id).toBe(
        `docs/verification/animation-completion/runtime-monsters/${entry.id}-generated-source.png`,
      );
      expect(entry.runtimeOutput?.path, entry.id).toBe(
        `assets/sprites/animations/batch-01/${entry.id}-v1.png`,
      );
      expect(entry.generatedSource?.sha256, entry.id).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.runtimeOutput?.sha256, entry.id).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.visualReview?.fullSize, entry.id).toBe(true);
      expect(entry.visualReview?.isolatedCells, entry.id).toBe(true);
      expect(entry.visualReview?.reviewedAt, entry.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
