import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { decodeRgbaPng, inspectAnimationSheet } from './image-contract';

interface PromptRecord {
  id: string;
  prompt: string;
}

interface FileEvidence {
  path: string;
  sha256: string;
}

interface LedgerEntry {
  id: string;
  state: 'pending' | 'accepted';
  prompt?: string;
  generatedSource?: FileEvidence;
  runtimeOutput?: FileEvidence;
  visualReview?: {
    fullSize: boolean;
    isolatedCells: boolean;
    reviewedAt: string;
  };
  [key: string]: unknown;
}

interface RuntimeManifestEntry {
  id: string;
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  idle: number[];
  attack: number[];
}

export interface AcceptAnimationWaveInput {
  recordsPath: string;
  reviewedAt: string;
  root?: string;
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function writeJsonAtomic(path: string, value: unknown): void {
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, path);
}

export function acceptAnimationWave(input: AcceptAnimationWaveInput): { accepted: string[] } {
  const root = resolve(input.root ?? '.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.reviewedAt))
    throw new Error(`reviewedAt must use YYYY-MM-DD: ${input.reviewedAt}`);

  const ledgerPath = resolve(
    root,
    'docs/verification/animation-completion/runtime-monsters/production-ledger.json',
  );
  const manifestPath = resolve(root, 'assets/sprites/animations/batch-01/manifest.json');
  const records = JSON.parse(readFileSync(resolve(root, input.recordsPath), 'utf8')) as PromptRecord[];
  const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8')) as { entries: LedgerEntry[] };
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as RuntimeManifestEntry[];
  const registered = new Set(manifest.map((entry) => entry.id));
  const accepted: string[] = [];

  for (const record of records) {
    if (!/^[a-z0-9-]+$/.test(record.id)) throw new Error(`Invalid monster id: ${record.id}`);
    if (record.prompt.trim().length <= 200)
      throw new Error(`${record.id}: production prompt must exceed 200 characters`);
    const entry = ledger.entries.find((candidate) => candidate.id === record.id);
    if (!entry) throw new Error(`${record.id}: production ledger entry is missing`);
    if (entry.state !== 'pending') throw new Error(`${record.id}: entry is already ${entry.state}`);
    if (registered.has(record.id)) throw new Error(`${record.id}: manifest entry already exists`);

    const sourcePath = `docs/verification/animation-completion/runtime-monsters/${record.id}-generated-source.png`;
    const runtimePath = `assets/sprites/animations/batch-01/${record.id}-v1.png`;
    const sourceAbsolute = resolve(root, sourcePath);
    const runtimeAbsolute = resolve(root, runtimePath);
    if (!existsSync(sourceAbsolute)) throw new Error(`${record.id}: missing ${sourcePath}`);
    if (!existsSync(runtimeAbsolute)) throw new Error(`${record.id}: missing ${runtimePath}`);
    const audit = inspectAnimationSheet(decodeRgbaPng(readFileSync(runtimeAbsolute)));
    if (audit.issues.length > 0) throw new Error(`${record.id}: ${audit.issues.join(', ')}`);

    entry.state = 'accepted';
    entry.prompt = record.prompt.trim();
    entry.generatedSource = { path: sourcePath, sha256: sha256(sourceAbsolute) };
    entry.runtimeOutput = { path: runtimePath, sha256: sha256(runtimeAbsolute) };
    entry.visualReview = {
      fullSize: true,
      isolatedCells: true,
      reviewedAt: input.reviewedAt,
    };
    manifest.push({
      id: record.id,
      key: `mon.animation.${record.id}.v1`,
      path: `sprites/animations/batch-01/${record.id}-v1.png`,
      frameWidth: 128,
      frameHeight: 128,
      idle: [0, 1, 0, 3, 0, 2, 0],
      attack: [4, 5, 6, 7, 0],
    });
    registered.add(record.id);
    accepted.push(record.id);
  }

  writeJsonAtomic(ledgerPath, ledger);
  writeJsonAtomic(manifestPath, manifest);
  return { accepted };
}

function option(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const result = acceptAnimationWave({
    recordsPath: option('--records'),
    reviewedAt: option('--reviewed-at'),
  });
  console.log(`animation wave accepted: ${result.accepted.join(', ')}`);
}
