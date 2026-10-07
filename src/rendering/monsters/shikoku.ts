/** 四国の地方ボス（手描き。docs/06 §4・§6.6 の規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';

/** ヨツノテンビン：四枚の皿を恣意的に傾ける石像の裁定獣。 */
const yotsuNoTenbin: MonsterDesign = {
  size: 56,
  colors: {
    N: NQ.navy,
    W: NQ.white,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    V: NQ.violet,
    B: NQ.blue,
    S: NQ.silver,
    T: NQ.brown,
  },
  rim: { [NQ.gold]: NQ.ochre, [NQ.silver]: NQ.slate, [NQ.violet]: NQ.indigo },
  rimDepth: 2,
  layers: [
    { x: 25, y: 5, rows: ['..GG..', '.GQQG.', 'GQNNQG', '..NN..', '..NN..', '..NN..', '..NN..'] },
    {
      x: 7,
      y: 13,
      rows: ['GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', 'QNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNQ'],
    },
    {
      mirror: true,
      x: 5,
      y: 15,
      rows: [
        '..N....N..',
        '..N....N..',
        '.NN....NN.',
        'NNNNNNNNNN',
        '.GGGGGGGG.',
        '..GQQQQG..',
        '...GGGG...',
      ],
    },
    {
      x: 19,
      y: 18,
      rows: [
        '...SSSSSSSSSS...',
        '..SSNNNNNNNNSS..',
        '.SSNWWNNNNWWNSS.',
        'SSNNWRNNNNRWNNSS',
        'SSNNNNNGGNNNNNSS',
        '.SSNNNNNNNNNNSS.',
        '..SSNNNNNNNNSS..',
        '...SSSSSSSSSS...',
      ],
    },
    {
      x: 25,
      y: 26,
      rows: [
        '..NN..',
        '.NVVN.',
        'NVGGVN',
        'NVGGVN',
        '.NVVN.',
        '..NN..',
        '..NN..',
        '..NN..',
        '..NN..',
        '..NN..',
        '..NN..',
        '..NN..',
        '..NN..',
        '.NNNN.',
        'NNNNNN',
      ],
    },
    {
      x: 12,
      y: 51,
      rows: [
        '....SSSSSSSSSSSSSSSSSSSS....',
        '..SSNNNNNNNNNNNNNNNNNNNNSS..',
        '.SSNNNNNNNNNNNNNNNNNNNNNNSS.',
        'SSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      ],
    },
  ],
};

export const SHIKOKU: Readonly<Record<string, MonsterDesign>> = {
  'shikoku-islandboss-yotsu-no-tenbin': yotsuNoTenbin,
};
