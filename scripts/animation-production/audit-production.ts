import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { decodeRgbaPng, inspectAnimationSheet } from './image-contract';

interface FileHash {
  path: string;
  sha256: string;
}

export type AnimationProductionAuditEntry =
  | { id: string; state: 'pending' }
  | {
      id: string;
      state: 'accepted';
      generatedSource?: FileHash;
      runtimeOutput?: FileHash;
    };

export interface AnimationProductionAuditInput {
  entries: AnimationProductionAuditEntry[];
  registeredIds: string[];
  root?: string;
}

async function sha256(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

function safePath(root: string, id: string, path: string): string {
  const absolute = resolve(root, path);
  const inside = relative(root, absolute);
  if (isAbsolute(path) || inside === '..' || inside.startsWith(`..${sep}`))
    throw new Error(`${id}: invalid production path ${path}`);
  return absolute;
}

export async function auditAnimationProduction(
  input: AnimationProductionAuditInput,
): Promise<{ accepted: number; pending: number; warnings: string[] }> {
  const root = resolve(input.root ?? '.');
  const registered = new Set(input.registeredIds);
  const warnings: string[] = [];
  let accepted = 0;
  let pending = 0;

  for (const entry of input.entries) {
    if (entry.state === 'pending') {
      if (registered.has(entry.id)) throw new Error(`${entry.id}: pending entry is registered`);
      pending += 1;
      continue;
    }

    if (!registered.has(entry.id)) throw new Error(`${entry.id}: accepted entry is not registered`);
    for (const file of [entry.generatedSource, entry.runtimeOutput]) {
      if (!file) throw new Error(`${entry.id}: accepted evidence is incomplete`);
      const absolute = safePath(root, entry.id, file.path);
      if (!existsSync(absolute)) throw new Error(`${entry.id}: missing ${file.path}`);
      if ((await sha256(absolute)) !== file.sha256)
        throw new Error(`${entry.id}: hash mismatch ${file.path}`);
    }

    const runtimePath = safePath(root, entry.id, entry.runtimeOutput!.path);
    const imageAudit = inspectAnimationSheet(decodeRgbaPng(readFileSync(runtimePath)));
    if (imageAudit.issues.length > 0) throw new Error(`${entry.id}: ${imageAudit.issues.join(', ')}`);
    warnings.push(...imageAudit.warnings.map((warning) => `${entry.id}: ${warning}`));
    accepted += 1;
  }

  return { accepted, pending, warnings };
}

async function main(): Promise<void> {
  const ledger = JSON.parse(
    readFileSync('docs/verification/animation-completion/runtime-monsters/production-ledger.json', 'utf8'),
  ) as { entries: AnimationProductionAuditEntry[] };
  const manifest = JSON.parse(readFileSync('assets/sprites/animations/batch-01/manifest.json', 'utf8')) as {
    id: string;
  }[];
  const result = await auditAnimationProduction({
    entries: ledger.entries,
    registeredIds: manifest.map((entry) => entry.id),
  });
  console.log(
    `animation production: ${result.accepted} accepted / ${result.pending} pending / ${result.warnings.length} warnings`,
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) await main();
