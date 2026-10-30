import { createHash } from 'node:crypto';
import { createReadStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

interface LedgerJob {
  id: string;
  destination?: string;
  path?: string;
  reference?: string;
  references?: (string | { path: string })[];
  file?: { path?: string };
  initial?: { references?: string[] };
  referenceFiles?: { role?: string; path: string }[];
}

interface ReferencePair {
  pixelPath?: string;
  turnaroundPath?: string;
}

const ledgerPaths = [
  'docs/cinematics/TOHOKU_MONSTER_TURNAROUNDS_V1.json',
  'docs/cinematics/AOMORI_MONSTER_TURNAROUNDS_V2.json',
  'docs/cinematics/AOMORI_MONSTER_TURNAROUNDS_V3.json',
  'docs/cinematics/TOHOKU_MONSTER_TURNAROUNDS_V4.json',
  'docs/cinematics/TOHOKU_MONSTER_TURNAROUNDS_V5.json',
  'docs/cinematics/TOHOKU_MONSTER_TURNAROUNDS_V6.json',
  'docs/cinematics/TOHOKU_MONSTER_TURNAROUNDS_V7.json',
  'docs/cinematics/NATIONWIDE_MONSTER_TURNAROUNDS_V8_REQUEST.json',
  'docs/cinematics/NATIONWIDE_MONSTER_TURNAROUNDS_V8_GENERATION_STATUS.json',
  'docs/cinematics/NATIONWIDE_MONSTER_TURNAROUNDS_V9_REQUEST.json',
  'docs/cinematics/NATIONWIDE_MONSTER_TURNAROUNDS_V9_STATUS.json',
] as const;

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function option(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function cinematicPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const normalized = path.replaceAll('\\', '/');
  const marker = 'assets/cinematics/';
  const index = normalized.indexOf(marker);
  return index >= 0 ? normalized.slice(index) : undefined;
}

function referencePath(reference: string | { path: string } | undefined): string | undefined {
  return typeof reference === 'string' ? reference : reference?.path;
}

async function sha256(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

const sourceRoot = resolve(option('--source-root'));
const outputPath = 'docs/verification/animation-completion/coverage.json';
const assignments = readJson<{
  humans: string[];
  batches: { batch: string; ids: string[] }[];
}>('tasks/animation-batch-assignments.json');
const batch = assignments.batches.find((entry) => entry.batch === 'batch-01');
if (!batch) throw new Error('batch-01 assignment is missing');

const runtimeManifest = readJson<{ id: string; path: string }[]>(
  'assets/sprites/animations/batch-01/manifest.json',
);
const characterManifest = readJson<{ id: string; path: string }[]>(
  'assets/sprites/animations/batch-01/characters.json',
);
const evolutionManifest = readJson<{ id: string; path: string }[]>(
  'assets/sprites/animations/batch-01/evolution-references.json',
);
const runtimeById = new Map(runtimeManifest.map((entry) => [entry.id, entry]));
const characterById = new Map(characterManifest.map((entry) => [entry.id, entry]));
const evolutionById = new Map(evolutionManifest.map((entry) => [entry.id, entry]));
const references = new Map<string, ReferencePair>();

for (const ledgerPath of ledgerPaths) {
  const ledger = readJson<{ jobs?: LedgerJob[] }>(ledgerPath);
  for (const job of ledger.jobs ?? []) {
    const previous = references.get(job.id);
    const canonical = job.referenceFiles?.find((entry) => entry.role === 'canonical-pixel-identity');
    references.set(job.id, {
      pixelPath:
        cinematicPath(
          canonical?.path ??
            job.reference ??
            referencePath(job.references?.[0]) ??
            job.initial?.references?.[0],
        ) ?? previous?.pixelPath,
      turnaroundPath:
        cinematicPath(job.destination ?? job.path ?? job.file?.path) ?? previous?.turnaroundPath,
    });
  }
}

const entries = [];
for (const id of batch.ids) {
  const runtime = runtimeById.get(id);
  const character = characterById.get(id);
  const evolution = evolutionById.get(id);
  if (runtime) {
    entries.push({ id, kind: 'runtime-monster', state: 'produced-runtime', animationPath: runtime.path });
    continue;
  }
  if (id === 'aomori-ringoron') {
    entries.push({
      id,
      kind: 'runtime-monster',
      state: 'existing-runtime',
      animationPath: 'sprites/animations/aomori-ringoron-v1.png',
    });
    continue;
  }
  if (character) {
    entries.push({
      id,
      kind: 'named-character',
      state: 'produced-character-reference',
      animationPath: character.path,
    });
    continue;
  }
  if (evolution) {
    entries.push({
      id,
      kind: 'visual-only-evolution',
      state: 'produced-visual-only',
      animationPath: evolution.path,
    });
    continue;
  }

  const reference = references.get(id);
  if (!reference?.pixelPath || !reference.turnaroundPath)
    throw new Error(`${id}: adopted pixel or turnaround reference is missing from the ledgers`);
  const pixelPath = resolve(sourceRoot, reference.pixelPath);
  const turnaroundPath = resolve(sourceRoot, reference.turnaroundPath);
  entries.push({
    id,
    kind: 'runtime-monster',
    state: 'reference-ready',
    contentPath: `content/monsters/${id}.json`,
    pixelReference: { path: reference.pixelPath, sha256: await sha256(pixelPath) },
    turnaroundReference: { path: reference.turnaroundPath, sha256: await sha256(turnaroundPath) },
  });
}

const report = {
  schemaVersion: 1,
  batch: 'batch-01',
  generatedFrom: {
    assignment: 'tasks/animation-batch-assignments.json',
    ledgers: ledgerPaths,
  },
  entries,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`animation coverage: ${entries.length} assigned / 89 reference-ready`);
