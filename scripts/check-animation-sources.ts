import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

interface ReferenceMetadata {
  path: string;
  sha256: string;
}

interface CoverageReport {
  entries: {
    id: string;
    state: string;
    pixelReference?: ReferenceMetadata;
    turnaroundReference?: ReferenceMetadata;
  }[];
}

export interface AnimationSourceAuditInput {
  reportPath: string;
  root: string;
}

async function sha256(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function auditAnimationSources(
  input: AnimationSourceAuditInput,
): Promise<{ entries: number; references: number }> {
  const report = JSON.parse(readFileSync(input.reportPath, 'utf8')) as CoverageReport;
  const sourceRoot = resolve(input.root);
  const cinematicRoot = resolve(sourceRoot, 'assets/cinematics');
  const pending = report.entries.filter((entry) => entry.state === 'reference-ready');
  let references = 0;

  for (const entry of pending) {
    for (const reference of [entry.pixelReference, entry.turnaroundReference]) {
      if (!reference) throw new Error(`${entry.id}: missing reference metadata`);
      const absolute = resolve(sourceRoot, reference.path);
      const inside = relative(cinematicRoot, absolute);
      if (
        isAbsolute(reference.path) ||
        !reference.path.startsWith('assets/cinematics/') ||
        inside === '..' ||
        inside.startsWith(`..${sep}`)
      )
        throw new Error(`${entry.id}: invalid source path ${reference.path}`);
      if (!existsSync(absolute)) throw new Error(`${entry.id}: missing ${reference.path}`);
      if ((await sha256(absolute)) !== reference.sha256)
        throw new Error(`${entry.id}: hash mismatch ${reference.path}`);
      references += 1;
    }
  }

  return { entries: pending.length, references };
}

function option(name: string, fallback?: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : fallback;
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main(): Promise<void> {
  const result = await auditAnimationSources({
    root: option('--source-root'),
    reportPath: option('--report', 'docs/verification/animation-completion/coverage.json'),
  });
  console.log(`animation sources: ${result.entries} entries / ${result.references} references OK`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) await main();
