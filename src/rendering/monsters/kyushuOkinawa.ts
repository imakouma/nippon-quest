/** 九州・沖縄の地方ボス（手描き。docs/06 §4・§6.6 の規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';

/** チシキグイノマオウ：奪った文字を壺の王冠へ閉じこめる異形の王。 */
const chishikigui: MonsterDesign = {
  size: 56,
  colors: {
    N: NQ.navy,
    W: NQ.white,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    V: NQ.violet,
    I: NQ.indigo,
    B: NQ.blue,
    S: NQ.silver,
  },
  rim: { [NQ.gold]: NQ.ochre, [NQ.violet]: NQ.indigo, [NQ.silver]: NQ.slate },
  rimDepth: 2,
  layers: [
    {
      x: 16,
      y: 3,
      rows: [
        'G...G...G...G...G...G',
        'GG.GGG.GGG.GGG.GGG.GG',
        '.GGGGGGGGGGGGGGGGGGG.',
        '..QQQQQQQQQQQQQQQQ..',
      ],
    },
    {
      x: 14,
      y: 8,
      rows: [
        '....NNNNNNNNNNNN....',
        '..NNVVVVVVVVVVVVNN..',
        '.NVVVVVVVVVVVVVVVVN.',
        'NVVVWWVVVVVVVVWWVVVN',
        'NVVVWRVVVVVVVVRWVVVN',
        'NVVVVVVVGGVVVVVVVVVN',
        '.NVVVVVGGGGVVVVVVVN.',
        '..NNVVVVVVVVVVVVNN..',
        '....NNNNNNNNNNNN....',
      ],
    },
    {
      mirror: true,
      x: 4,
      y: 17,
      rows: [
        '....NNNN....',
        '..NNVVVVNN..',
        '.NVVVVVVVVN.',
        'NVVVGGGGVVVN',
        'NVVGGQQGGVVN',
        '.NVVGGGGVVN.',
        '..NNVVVVNN..',
        '....NNNN....',
      ],
    },
    {
      x: 19,
      y: 18,
      rows: [
        '...NNNNNNNNNN...',
        '..NVVVVVVVVVVN..',
        '.NVVSSSSSSSSVVN.',
        'NVVSSBBBBBBSSVVN',
        'NVVSBWWBBWWBSVVN',
        'NVVSSBBBBBBSSVVN',
        '.NVVVSSSSSSVVVN.',
        '..NNVVVVVVVVNN..',
      ],
    },
    {
      x: 20,
      y: 27,
      rows: [
        '..NNNNNNNNNN..',
        '.NVVVVVVVVVVN.',
        'NVVVGGGGGGVVVN',
        'NVVGGQQQQGGVVN',
        'NVVGGQNNQGGVVN',
        'NVVGGQNNQGGVVN',
        'NVVGGQQQQGGVVN',
        'NVVVGGGGGGVVVN',
        '.NVVVVVVVVVVN.',
        '..NNNNNNNNNN..',
        '.....NN......',
        '.....NN......',
        '....NNNN.....',
        '...NNNNNN....',
      ],
    },
    {
      x: 10,
      y: 51,
      rows: [
        '......SSSSSSSSSSSSSSSSSS......',
        '...SSSNNNNNNNNNNNNNNNNNNSSS...',
        '.SSNNNNNNNNNNNNNNNNNNNNNNNNSS.',
        'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      ],
    },
  ],
};

export const KYUSHU_OKINAWA: Readonly<Record<string, MonsterDesign>> = {
  'kyushu-okinawa-islandboss-chishikigui': chishikigui,
};
