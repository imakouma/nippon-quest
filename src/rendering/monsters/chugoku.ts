/** 中国地方の地方ボス（手描き。docs/06 §4・§6.6 の規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';

/** イツツノカタリベ：五枚の証言札を風で混ぜる仮面の語り部。 */
const itsutsuNoKataribe: MonsterDesign = {
  size: 56,
  colors: {
    N: NQ.navy,
    W: NQ.white,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    V: NQ.violet,
    B: NQ.blue,
    P: NQ.paper,
    T: NQ.brown,
  },
  rim: { [NQ.gold]: NQ.ochre, [NQ.violet]: NQ.indigo, [NQ.paper]: NQ.cloud },
  rimDepth: 2,
  layers: [
    {
      x: 7,
      y: 8,
      rows: [
        'PPPPPPP....PPPPPPP....PPPPPPP',
        'PNNNNNP....PNNNNNP....PNNNNNP',
        'PNBGBNP....PNRGRNP....PNVGVNP',
        'PNNNNNP....PNNNNNP....PNNNNNP',
        'PPPPPPP....PPPPPPP....PPPPPPP',
      ],
    },
    {
      x: 13,
      y: 16,
      rows: [
        'PPPPPPP........PPPPPPP',
        'PNNNNNP........PNNNNNP',
        'PNQGQNP........PNWGWNP',
        'PNNNNNP........PNNNNNP',
        'PPPPPPP........PPPPPPP',
      ],
    },
    {
      x: 15,
      y: 22,
      rows: [
        '......GGGGGGGGGG......',
        '....GGQQQQQQQQQQGG....',
        '..GGQNNNNNNNNNNNNQGG..',
        '.GQNNNWWNNNNWWNNNQG.',
        'GQNNNNRNNNNNNRNNNNQG',
        'GQNNNNNNNGGNNNNNNNQG',
        '.GQNNNNNGQQGNNNNNQG.',
        '..GGQNNNNNNNNNNQGG..',
        '....GGQQNNNNQQGG....',
      ],
    },
    { mirror: true, x: 10, y: 31, rows: ['NNN', 'NVN', 'NNN', '.N.', '.N.'] },
    {
      x: 18,
      y: 41,
      rows: [
        'NNNNNNNNNNNNNNNNNNNN',
        'NVVVVVNNNNNNNVVVVVVN',
        'NNNNNNNNNNNNNNNNNNNN',
        '..TTTT........TTTT..',
        '..TTTT........TTTT..',
      ],
    },
    {
      x: 10,
      y: 50,
      rows: [
        '....NNNNNNNNNNNNNNNNNNNNNNNN....',
        '..NNNNNNNNNNNNNNNNNNNNNNNNNNNN..',
        'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
      ],
    },
  ],
};

export const CHUGOKU: Readonly<Record<string, MonsterDesign>> = {
  'chugoku-islandboss-itsutsu-no-kataribe': itsutsuNoKataribe,
};
