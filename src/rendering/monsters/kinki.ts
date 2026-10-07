/** 近畿の地方ボス（手描き。docs/06 §4・§6.6 の規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';

const plot = (size: number, paint: (x: number, y: number) => string): string[] =>
  Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => paint(x, y)).join(''));

/** ロッカギノオリ：六つの資料箱を鍵と格子で分断する巨大な書庫獣。 */
const rokkagi: MonsterDesign = {
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
      x: 8,
      y: 12,
      rows: [
        'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
        'NPPPPPNPPPPPNPPPPPNPPPPPNPPPPPNPPPPPN',
        'NPGGPPNPGGPPNPGGPPNPGGPPNPGGPPNPGGPPN',
        'NPPPPPNPPPPPNPPPPPNPPPPPNPPPPPNPPPPPN',
        'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
      ],
    },
    {
      rows: plot(56, (x, y) =>
        y >= 18 && y <= 47 && x >= 10 && x <= 45
          ? x % 7 === 0 || y % 8 === 0
            ? 'N'
            : (x + y) % 11 < 2
              ? 'V'
              : 'P'
          : '.',
      ),
    },
    {
      x: 17,
      y: 6,
      rows: [
        '........GG........',
        '.....GGGQQGGG.....',
        '...GGQQNNNNQQGG...',
        '.GGQNNNNNNNNNNQGG.',
        'GQNNNNNNNNNNNNNNQG',
      ],
    },
    { mirror: true, x: 18, y: 20, rows: ['NNNNN', 'NWWNN', 'NWRNN', '.NNN.', '..N..'] },
    { x: 22, y: 30, rows: ['GQG.GQG.GQG', 'QGQ.QGQ.QGQ', '.N...N...N.', 'GQG.GQG.GQG', 'QGQ.QGQ.QGQ'] },
    {
      x: 14,
      y: 51,
      rows: [
        '....NNNNNNNNNNNNNNNN....',
        '..NNNNNNNNNNNNNNNNNNNN..',
        '.NNNNNNNNNNNNNNNNNNNNNN.',
        'NNNNNNNNNNNNNNNNNNNNNNNN',
      ],
    },
  ],
};

export const KINKI: Readonly<Record<string, MonsterDesign>> = {
  'kinki-islandboss-rokkagi-no-ori': rokkagi,
};
