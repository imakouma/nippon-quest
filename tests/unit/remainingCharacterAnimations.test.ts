import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { monsterAnimationSpec, type MonsterAnimationSpec } from '../../src/rendering/monsterAnimation';
import { auditAnimationProduction } from '../../scripts/animation-production/audit-production';
import { decodeRgbaPng, inspectAnimationSheet } from '../../scripts/animation-production/image-contract';

const TARGET_IDS = [
  'koshinetsu-boss',
  'miyagi-lastboss-date-masamune',
  'miyagi-sasakama-uo',
  'miyazaki-boss-takachiho-no-nushi',
  'miyazaki-mangocchi',
  'miyazaki-tarutaru-kokko',
  'nagano-oomori-soba',
  'nagano-yukemuri-zaru',
  'nagasaki-kurawan-nushi',
  'nagasaki-mogikko',
  'nara-happazushi',
  'nara-somen-tsururi',
  'niigata-boss-shinanogawa-no-nushi',
  'niigata-kotoki',
  'oita-boss-yukemuryu',
  'oita-midboss-yabakeiwa',
  'oita-yukemurin',
  'okayama-denim-bushi',
  'okayama-midboss-mouretsu-jersey',
  'okinawa-goyamaru',
  'okinawa-painapon',
  'osaka-fusanari-don',
  'osaka-midboss-abare-danjiri',
  'saga-chabashira',
  'saga-midboss-toumeika',
  'saitama-boss-yomatsuri-daio',
  'saitama-midboss-gon-yagura',
  'shiga-boss-dainamazu',
  'shiga-lastboss-ii-naosuke',
  'shikoku-islandboss-yotsu-no-tenbin',
  'shimane-oohi-rosoku',
  'shimane-warigon',
  'shizuoka-kazekiri-dako',
  'shizuoka-unagi-nobori',
  'tochigi-go-bellmoo',
  'tochigi-lastboss-nasu-no-yoichi',
  'tokushima-kazura-musasabi',
  'tokushima-oogamedon',
  'tokyo-daikon-zamurai',
  'tokyo-musasabyun',
  'tottori-boss-sakyu-majin',
  'tottori-perawashi',
  'toyama-fubuki-okojo',
  'toyama-midboss-gabujishi',
  'wakayama-bincho-homura',
  'wakayama-mamori-toudai',
  'wakayama-toudain',
  'yamagata-lastboss-matsuo-basho',
  'yamagata-yukemurin',
  'yamaguchi-lastboss-yoshida-shoin',
  'yamaguchi-noborigaman',
  'yamanashi-budoon',
  'yamanashi-momorin',
] as const;

function runtimeMonsterIds(): string[] {
  return readdirSync('content/monsters')
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(`content/monsters/${name}`, 'utf8')) as { id: string })
    .map((monster) => monster.id)
    .sort();
}

describe('remaining runtime monster animations', () => {
  it('freezes 53 unique production targets that all exist at runtime', () => {
    const runtimeIds = new Set(runtimeMonsterIds());

    expect(TARGET_IDS).toHaveLength(53);
    expect(new Set(TARGET_IDS).size).toBe(53);
    expect(TARGET_IDS.every((id) => runtimeIds.has(id))).toBe(true);
  });

  it('registers exactly the frozen targets in batch-06', () => {
    const manifestPath = 'assets/sprites/animations/batch-06/manifest.json';
    expect(existsSync(manifestPath)).toBe(true);
    if (!existsSync(manifestPath)) return;

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as MonsterAnimationSpec[];
    expect(manifest.map((entry) => entry.id).sort()).toEqual([...TARGET_IDS].sort());
    for (const entry of manifest) {
      expect(entry).toEqual({
        id: entry.id,
        key: `mon.animation.${entry.id}.v1`,
        path: `sprites/animations/batch-06/${entry.id}-v1.png`,
        frameWidth: 128,
        frameHeight: 128,
        idle: [0, 1, 0, 3, 0, 2, 0],
        attack: [4, 5, 6, 7, 0],
      });
      const audit = inspectAnimationSheet(decodeRgbaPng(readFileSync(`assets/${entry.path}`)));
      expect(audit.issues, entry.id).toEqual([]);
    }
  });

  it('hash-links every accepted reference, source, and runtime sheet', async () => {
    const ledger = JSON.parse(
      readFileSync(
        'docs/verification/animation-completion/remaining-runtime-monsters/production-ledger.json',
        'utf8',
      ),
    ) as {
      entries: {
        id: string;
        state: 'accepted';
        prompt: string;
        pixelReference: { path: string; sha256: string };
        generatedSource: { path: string; sha256: string };
        runtimeOutput: { path: string; sha256: string };
        visualReview: { fullSize: boolean; isolatedCells: boolean; reviewedAt: string };
      }[];
    };
    const manifest = JSON.parse(
      readFileSync('assets/sprites/animations/batch-06/manifest.json', 'utf8'),
    ) as MonsterAnimationSpec[];

    expect(ledger.entries.map((entry) => entry.id).sort()).toEqual([...TARGET_IDS].sort());
    for (const entry of ledger.entries) {
      expect(entry.state, entry.id).toBe('accepted');
      expect(entry.prompt.length, entry.id).toBeGreaterThan(200);
      expect(entry.pixelReference.sha256, entry.id).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.generatedSource.sha256, entry.id).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.runtimeOutput.sha256, entry.id).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.visualReview, entry.id).toEqual({
        fullSize: true,
        isolatedCells: true,
        reviewedAt: '2026-10-30',
      });
    }
    await expect(
      auditAnimationProduction({
        entries: ledger.entries,
        registeredIds: manifest.map((entry) => entry.id),
      }),
    ).resolves.toMatchObject({ accepted: 53, pending: 0 });
  }, 60_000);

  it('resolves one animation for all 542 runtime monsters', () => {
    const runtimeIds = runtimeMonsterIds();
    const missing = runtimeIds.filter((id) => !monsterAnimationSpec(id));

    expect(runtimeIds).toHaveLength(542);
    expect(new Set(runtimeIds).size).toBe(542);
    expect(missing).toEqual([]);
  });
});
