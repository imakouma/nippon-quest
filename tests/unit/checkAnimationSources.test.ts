import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditAnimationSources } from '../../scripts/check-animation-sources';

const roots: string[] = [];

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function fixture(options?: { missing?: boolean; hash?: string; path?: string }) {
  const root = mkdtempSync(join(tmpdir(), 'nq-animation-sources-'));
  roots.push(root);
  const referencePath = options?.path ?? 'assets/cinematics/monsters/example/turnaround-v1.png';
  const pixelPath = 'assets/cinematics/monsters/example/pixel-references/example.png';
  if (!options?.missing) {
    for (const path of [referencePath, pixelPath]) {
      const absolute = join(root, path);
      mkdirSync(dirname(absolute), { recursive: true });
      writeFileSync(absolute, path);
    }
  }
  const reportPath = join(root, 'coverage.json');
  writeFileSync(
    reportPath,
    JSON.stringify({
      entries: [
        {
          id: 'example',
          state: 'reference-ready',
          pixelReference: { path: pixelPath, sha256: sha256(pixelPath) },
          turnaroundReference: {
            path: referencePath,
            sha256: options?.hash ?? sha256(referencePath),
          },
        },
      ],
    }),
  );
  return { reportPath, root };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('auditAnimationSources', () => {
  it('verifies both production references for a pending monster', async () => {
    const input = fixture();

    await expect(auditAnimationSources(input)).resolves.toEqual({ entries: 1, references: 2 });
  });

  it('identifies a missing production original by monster ID', async () => {
    const input = fixture({ missing: true });

    await expect(auditAnimationSources(input)).rejects.toThrow(/example: missing/);
  });

  it('rejects changed production bytes', async () => {
    const input = fixture({ hash: '0'.repeat(64) });

    await expect(auditAnimationSources(input)).rejects.toThrow(/example: hash mismatch/);
  });

  it('rejects references outside the cinematic source directory', async () => {
    const input = fixture({ path: 'content/monsters/example.json' });

    await expect(auditAnimationSources(input)).rejects.toThrow(/example: invalid source path/);
  });
});
