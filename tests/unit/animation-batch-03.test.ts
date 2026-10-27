import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import assignments from '../../tasks/animation-batch-assignments.json';
import manifest from '../../assets/sprites/animations/batch-03/manifest.json';
import { monsterAnimationSpec, type MonsterAnimationSpec } from '../../src/rendering/monsterAnimation';

const producedIds = [
  'aichi-boss-kinshachi-ou',
  'aichi-kokekokkochin',
  'aichi-shiborin',
  'akita-chuken-maru',
  'akita-lastboss-satake-yoshinobu',
  'akita-wappa-toride',
  'chiba-kujukurin',
  'chiba-peanight',
  'ehime-iyokan-musha',
  'ehime-lastboss-murakami-takeyoshi',
  'fukui-boss-echizen-gani-ou',
  'fukui-lastboss-matsudaira-shungaku',
  'fukui-raputorun',
  'fukuoka-boss-hiraodaio',
  'fukuoka-midboss-banana-taisho',
  'fukuoka-suigo-maru',
  'fukushima-akatsuki-momo',
  'fukushima-kura-donburi',
  'fukushima-yaoki-koboshi',
  'gifu-kamiori-dori',
  'gifu-oriben',
  'gunma-boss-gankake-daruma',
  'gunma-kyabezukin',
  'gunma-purukon',
  'hiroshima-kakigaran',
  'hiroshima-onbashigame',
  'hokkaido-ami-melon',
  'hokkaido-hotaten',
  'hokkaido-jet-hotate',
  'hokkaido-lavendori',
  'hokuriku-islandboss-kagamiutsushi',
  'hyogo-lastboss-ikeda-terumasa',
  'hyogo-sorobanban',
  'ibaraki-aozora-hime',
  'ibaraki-hobikin',
  'ibaraki-nemofin',
  'ishikawa-gosai-bon',
  'ishikawa-kinpaku-cho',
  'ishikawa-oo-hamashion',
  'kagawa-kororibu',
  'kagawa-mizukagami',
  'kagawa-zenigani',
  'kagoshima-kurogane-boo',
  'kagoshima-nabezurun',
  'kanagawa-boss-yokohama-shishi-oh',
  'kanagawa-kazakiri-tonbi',
  'kanagawa-piihyoro',
  'kochi-boss-kuroshio-kujira',
  'kochi-lastboss-sakamoto-ryoma',
  'kumamoto-ebi-musha',
  'kumamoto-midboss-kindouro',
  'kumamoto-tatamin',
  'kyoto-chirimen-mai',
  'kyoto-hontoha-karain',
  'kyushu-okinawa-islandboss-chishikigui',
  'mie-iga-jonin',
  'mie-shinju-hime',
] as const;

describe('animation batch-03', () => {
  it('制作済み57体のシートをmanifestへ登録する', () => {
    const batch = assignments.batches.find((candidate) => candidate.batch === 'batch-03');
    expect(batch?.ids).toHaveLength(110);

    const specs = manifest as MonsterAnimationSpec[];
    expect(specs.map((spec) => spec.id)).toEqual(expect.arrayContaining([...producedIds]));

    for (const id of producedIds) {
      const spec = specs.find((candidate) => candidate.id === id);
      expect(spec).toEqual({
        id,
        key: `mon.animation.${id}.v1`,
        path: `sprites/animations/batch-03/${id}-v1.png`,
        frameWidth: 128,
        frameHeight: 128,
        idle: [0, 1, 0, 3, 0, 2, 0],
        attack: [4, 5, 6, 7, 0],
      });
      expect(monsterAnimationSpec(id)).toEqual(spec);

      const path = `assets/${spec!.path}`;
      expect(existsSync(path)).toBe(true);
      const png = readFileSync(path);
      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(png.readUInt32BE(16)).toBe(512);
      expect(png.readUInt32BE(20)).toBe(256);
    }
  });
});
