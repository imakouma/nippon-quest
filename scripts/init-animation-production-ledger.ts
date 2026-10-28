import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

interface ReferenceMetadata {
  path: string;
  sha256: string;
}

interface CoverageEntry {
  id: string;
  state: string;
  pixelReference?: ReferenceMetadata;
  turnaroundReference?: ReferenceMetadata;
}

interface CoverageReport {
  batch: string;
  entries: CoverageEntry[];
}

interface RuntimeManifestEntry {
  id: string;
}

export interface AnimationProductionLedger {
  schemaVersion: 1;
  batch: string;
  baselineRuntimeIds: string[];
  entries: {
    id: string;
    state: 'pending';
    pixelReference: ReferenceMetadata;
    turnaroundReference: ReferenceMetadata;
  }[];
}

export function createAnimationProductionLedger(
  coverage: CoverageReport,
  runtimeManifest: RuntimeManifestEntry[],
): AnimationProductionLedger {
  const targets = coverage.entries.filter((entry) => entry.state === 'reference-ready');
  if (coverage.batch !== 'batch-01') throw new Error(`Unexpected coverage batch: ${coverage.batch}`);
  if (runtimeManifest.length !== 12)
    throw new Error(`Expected 12 baseline runtime entries, received ${runtimeManifest.length}`);
  if (targets.length !== 89)
    throw new Error(`Expected 89 reference-ready targets, received ${targets.length}`);

  return {
    schemaVersion: 1,
    batch: coverage.batch,
    baselineRuntimeIds: runtimeManifest.map((entry) => entry.id),
    entries: targets.map((entry) => {
      if (!entry.pixelReference || !entry.turnaroundReference)
        throw new Error(`${entry.id}: adopted reference metadata is missing`);
      return {
        id: entry.id,
        state: 'pending',
        pixelReference: entry.pixelReference,
        turnaroundReference: entry.turnaroundReference,
      };
    }),
  };
}

function option(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}

function main(): void {
  const coveragePath = option('--coverage', 'docs/verification/animation-completion/coverage.json');
  const manifestPath = option('--manifest', 'assets/sprites/animations/batch-01/manifest.json');
  const outputPath = option(
    '--output',
    'docs/verification/animation-completion/runtime-monsters/production-ledger.json',
  );
  if (existsSync(outputPath) && !process.argv.includes('--force'))
    throw new Error(`${outputPath} already exists; use --force only to replace it intentionally`);

  const coverage = JSON.parse(readFileSync(coveragePath, 'utf8')) as CoverageReport;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as RuntimeManifestEntry[];
  const ledger = createAnimationProductionLedger(coverage, manifest);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(
    `animation production ledger: ${ledger.entries.length} targets / ${ledger.baselineRuntimeIds.length} baseline`,
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) main();
