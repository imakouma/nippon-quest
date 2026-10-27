import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import assignments from '../../tasks/animation-batch-assignments.json';
import type { MonsterAnimationSpec } from '../../src/rendering/monsterAnimation';

const batch = assignments.batches.find((candidate) => candidate.batch === 'batch-04')!;
const manifestPath = 'assets/sprites/animations/batch-04/manifest.json';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as MonsterAnimationSpec[];

describe('batch-04 のモンスターアニメーション', () => {
  it('制作済み20体を担当内の完成素材として登録する', () => {
    expect(manifest.map((spec) => spec.id)).toEqual([
      'aichi-denkikun',
      'aichi-lastboss-oda-nobunaga',
      'aichi-tebasakky',
      'akita-hanabii',
      'akita-magewappan',
      'chiba-boss-shoyu-ryu',
      'chiba-lastboss-ino-tadataka',
      'chiba-sharirin',
      'ehime-jakotendai',
      'ehime-midboss-yuamisagi',
      'fukui-fukui-raptor',
      'fukui-megane-hakase',
      'fukui-suisenko',
      'fukuoka-donkomaru',
      'fukuoka-rokuro-kanna',
      'fukuoka-tobikanna',
      'fukushima-boss-tsurugajo-no-nushi',
      'fukushima-lastboss-gamo-ujisato',
      'gifu-boss-gassho-daiou',
      'gifu-lastboss-saito-dosan',
    ]);
  });

  it('全登録が共通の8コマ契約と担当範囲を守る', () => {
    for (const spec of manifest) {
      expect(batch.ids).toContain(spec.id);
      expect(spec).toMatchObject({
        key: `mon.animation.${spec.id}.v1`,
        path: `sprites/animations/batch-04/${spec.id}-v1.png`,
        frameWidth: 128,
        frameHeight: 128,
        idle: [0, 1, 0, 3, 0, 2, 0],
        attack: [4, 5, 6, 7, 0],
      });
      expect(existsSync(`assets/${spec.path}`)).toBe(true);
      const png = readFileSync(`assets/${spec.path}`);
      expect(png.readUInt32BE(16)).toBe(512);
      expect(png.readUInt32BE(20)).toBe(256);
    }
  });
});
