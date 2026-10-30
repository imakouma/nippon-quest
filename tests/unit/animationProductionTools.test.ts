import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import runtimeManifest from '../../assets/sprites/animations/batch-01/manifest.json';
import { auditAnimationProduction } from '../../scripts/animation-production/audit-production';
import { renderAnimationContactSheet } from '../../scripts/animation-production/contact-sheet';
import {
  decodeRgbaPng,
  inspectAnimationSheet,
  type DecodedRgbaImage,
} from '../../scripts/animation-production/image-contract';
import { normalizeAnimationSheet } from '../../scripts/animation-production/normalize-sheet';
import { acceptAnimationWave } from '../../scripts/animation-production/accept-wave';
import { exportMonsterReferences } from '../../scripts/animation-production/export-references';

function sheet(): DecodedRgbaImage {
  return { width: 512, height: 256, pixels: new Uint8Array(512 * 256 * 4) };
}

function fileSha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function paintRect(
  image: DecodedRgbaImage,
  frame: number,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const cellX = (frame % 4) * 128;
  const cellY = Math.floor(frame / 4) * 128;
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      const offset = ((cellY + py) * image.width + cellX + px) * 4;
      image.pixels[offset] = 40 + frame * 5;
      image.pixels[offset + 1] = 120;
      image.pixels[offset + 2] = 200;
      image.pixels[offset + 3] = 255;
    }
  }
}

function clearFrame(image: DecodedRgbaImage, frame: number): void {
  const cellX = (frame % 4) * 128;
  const cellY = Math.floor(frame / 4) * 128;
  for (let py = 0; py < 128; py += 1) {
    const start = ((cellY + py) * image.width + cellX) * 4;
    image.pixels.fill(0, start, start + 128 * 4);
  }
}

function validSyntheticSheet(): DecodedRgbaImage {
  const image = sheet();
  for (let frame = 0; frame < 8; frame += 1) {
    paintRect(image, frame, 42, 40, 44, 56);
    paintRect(image, frame, 30 + frame * 2, 55, 12, 8 + frame * 2);
    if (frame >= 4) paintRect(image, frame, 78, 48, 10 + frame * 2, 10);
  }
  return image;
}

describe('animation production image contract', () => {
  it('rejects unsafe or duplicate reference-export IDs before opening a browser', async () => {
    await expect(
      exportMonsterReferences({ baseUrl: 'http://127.0.0.1:4175', ids: ['../monster'], outputDir: 'out' }),
    ).rejects.toThrow('Invalid monster id');
    await expect(
      exportMonsterReferences({
        baseUrl: 'http://127.0.0.1:4175',
        ids: ['same-id', 'same-id'],
        outputDir: 'out',
      }),
    ).rejects.toThrow('Duplicate monster id');
  });

  it('accepts every existing reviewed batch sheet', () => {
    for (const entry of runtimeManifest) {
      const png = readFileSync(`assets/${entry.path}`);
      const audit = inspectAnimationSheet(decodeRgbaPng(png), { allowLegacyMargins: true });

      expect(audit.issues, entry.id).toEqual([]);
      expect(audit.frames, entry.id).toHaveLength(8);
    }
  });

  it('accepts eight occupied cells with internal pose changes', () => {
    expect(inspectAnimationSheet(validSyntheticSheet()).issues).toEqual([]);
  });

  it('rejects wrong dimensions, blank cells, and unsafe cell edges', () => {
    const wrongSize = { ...validSyntheticSheet(), width: 256 };
    expect(inspectAnimationSheet(wrongSize).issues).toContain('sheet-size');

    const blank = validSyntheticSheet();
    clearFrame(blank, 3);
    expect(inspectAnimationSheet(blank).issues).toContain('frame-occupancy:3');

    const unsafe = validSyntheticSheet();
    paintRect(unsafe, 5, 0, 30, 2, 32);
    expect(inspectAnimationSheet(unsafe).issues).toContain('frame-margin:5');
  });

  it('rejects duplicated or transform-only motion', () => {
    const translated = sheet();
    for (let frame = 0; frame < 8; frame += 1)
      paintRect(translated, frame, 30 + frame * 3, 40 + frame, 48, 48);

    const issues = inspectAnimationSheet(translated).issues;
    expect(issues).toContain('idle-motion');
    expect(issues).toContain('attack-transform-only');
  });

  it('normalizes an accepted 2:1 generated source to the strict runtime contract', () => {
    const root = mkdtempSync(join(tmpdir(), 'nq-animation-normalize-'));
    const outputPath = join(root, 'aomori-bunakko-v1.png');
    try {
      normalizeAnimationSheet({
        inputPath: 'docs/verification/animation-batch-01/aomori-bunakko-generated-source.png',
        outputPath,
      });
      const audit = inspectAnimationSheet(decodeRgbaPng(readFileSync(outputPath)));
      expect(audit.issues).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('can inset every generated cell to repair unsafe source boundaries', () => {
    const root = mkdtempSync(join(tmpdir(), 'nq-animation-inset-'));
    const outputPath = join(root, 'aomori-oirase-kokejin-v1.png');
    try {
      normalizeAnimationSheet({
        inputPath:
          'docs/verification/animation-completion/runtime-monsters/aomori-oirase-kokejin-generated-source.png',
        outputPath,
        cellInset: 4,
      });
      expect(inspectAnimationSheet(decodeRgbaPng(readFileSync(outputPath))).issues).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('renders a portable labelled contact sheet at native and enlarged scales', () => {
    const html = renderAnimationContactSheet([
      {
        id: 'aomori-buna-taiju',
        sourcePath: 'aomori-buna-taiju-generated-source.png',
        runtimePath: '../../../assets/sprites/animations/batch-01/aomori-buna-taiju-v1.png',
      },
    ]);

    expect(html).toContain('aomori-buna-taiju');
    expect(html).toContain('data-scale="1"');
    expect(html).toContain('data-scale="2"');
    expect(html).toContain('image-rendering: pixelated');
  });

  it('audits accepted output hashes and rejects registration without acceptance', async () => {
    const sourcePath = 'docs/verification/animation-batch-01/aomori-bunakko-generated-source.png';
    const runtimePath = 'assets/sprites/animations/batch-01/aomori-bunakko-v1.png';
    const accepted = {
      id: 'aomori-bunakko',
      state: 'accepted' as const,
      generatedSource: { path: sourcePath, sha256: fileSha256(sourcePath) },
      runtimeOutput: { path: runtimePath, sha256: fileSha256(runtimePath) },
    };

    await expect(
      auditAnimationProduction({ entries: [accepted], registeredIds: ['aomori-bunakko'] }),
    ).resolves.toMatchObject({ accepted: 1, pending: 0 });
    await expect(
      auditAnimationProduction({
        entries: [
          {
            ...accepted,
            runtimeOutput: { ...accepted.runtimeOutput, sha256: '0'.repeat(64) },
          },
        ],
        registeredIds: ['aomori-bunakko'],
      }),
    ).rejects.toThrow(/aomori-bunakko: hash mismatch/);
    await expect(
      auditAnimationProduction({
        entries: [{ id: 'aomori-bunakko', state: 'pending' }],
        registeredIds: ['aomori-bunakko'],
      }),
    ).rejects.toThrow(/aomori-bunakko: pending entry is registered/);
  });

  it('accepts a reviewed wave into the ledger and runtime manifest in one validated operation', () => {
    const root = mkdtempSync(join(tmpdir(), 'nq-animation-accept-'));
    const evidence = join(root, 'docs/verification/animation-completion/remaining-runtime-monsters');
    const runtime = join(root, 'assets/sprites/animations/batch-06');
    mkdirSync(evidence, { recursive: true });
    mkdirSync(runtime, { recursive: true });
    copyFileSync(
      'docs/verification/animation-batch-01/aomori-bunakko-generated-source.png',
      join(evidence, 'test-monster-generated-source.png'),
    );
    copyFileSync(
      'assets/sprites/animations/batch-01/aomori-bunakko-v1.png',
      join(runtime, 'test-monster-v1.png'),
    );
    mkdirSync(join(evidence, 'references'), { recursive: true });
    copyFileSync(
      'docs/verification/animation-completion/remaining-runtime-monsters/references/koshinetsu-boss-reference.png',
      join(evidence, 'references/test-monster-reference.png'),
    );
    writeFileSync(
      join(evidence, 'production-ledger.json'),
      `${JSON.stringify({ entries: [{ id: 'test-monster', state: 'pending' }] }, null, 2)}\n`,
    );
    writeFileSync(join(runtime, 'manifest.json'), '[]\n');
    writeFileSync(
      join(root, 'records.json'),
      `${JSON.stringify([
        {
          id: 'test-monster',
          prompt:
            'Create an exact transparent four by two pixel-art animation sheet that preserves the supplied identity, palette, silhouette, equipment count and facial features. Frames zero through three form a readable breathing and blinking idle loop. Frames four through seven form anticipation, a strong transformed attack pose and recovery. Keep all eight full-body poses isolated inside equal cells with stable scale, true alpha transparency, ample empty margins, and no text, grid, scenery, shadow, detached effect or extra object.',
        },
      ])}\n`,
    );

    try {
      expect(
        acceptAnimationWave({
          root,
          recordsPath: 'records.json',
          reviewedAt: '2026-10-30',
          batch: 'batch-06',
          verificationId: 'remaining-runtime-monsters',
        }),
      ).toEqual({ accepted: ['test-monster'] });
      const ledger = JSON.parse(readFileSync(join(evidence, 'production-ledger.json'), 'utf8'));
      const manifest = JSON.parse(readFileSync(join(runtime, 'manifest.json'), 'utf8'));
      expect(ledger.entries[0]).toMatchObject({
        state: 'accepted',
        visualReview: { fullSize: true, isolatedCells: true, reviewedAt: '2026-10-30' },
      });
      expect(ledger.entries[0].generatedSource.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(ledger.entries[0].pixelReference).toMatchObject({
        path: 'docs/verification/animation-completion/remaining-runtime-monsters/references/test-monster-reference.png',
      });
      expect(ledger.entries[0].pixelReference.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(manifest[0]).toMatchObject({
        id: 'test-monster',
        key: 'mon.animation.test-monster.v1',
        path: 'sprites/animations/batch-06/test-monster-v1.png',
        idle: [0, 1, 0, 3, 0, 2, 0],
        attack: [4, 5, 6, 7, 0],
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects unsafe batch and verification path selectors before reading production files', () => {
    const base = { recordsPath: 'records.json', reviewedAt: '2026-10-30' };

    expect(() => acceptAnimationWave({ ...base, batch: '../batch-06' })).toThrow('Invalid animation batch');
    expect(() => acceptAnimationWave({ ...base, verificationId: '../evidence' })).toThrow(
      'Invalid verification id',
    );
  });
});
