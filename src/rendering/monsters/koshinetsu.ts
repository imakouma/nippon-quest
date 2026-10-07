/** 甲信の地方ボス（手描き。docs/06 §4・§6.6 の規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';

const plot = (size: number, paint: (x: number, y: number) => string): string[] =>
  Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => paint(x, y)).join(''));

/** センリンウツロ：二つの山岳視点を、偽の測量線で一枚へ押しつぶす巨鳥。 */
const senrinUtsuro: MonsterDesign = {
  size: 56,
  colors: {
    N: NQ.navy,
    K: NQ.ink,
    W: NQ.white,
    G: NQ.gold,
    Q: NQ.ochre,
    A: NQ.aqua,
    S: NQ.sky,
    V: NQ.violet,
    R: NQ.red,
    T: NQ.green,
  },
  rim: { [NQ.gold]: NQ.ochre, [NQ.aqua]: NQ.sky, [NQ.violet]: NQ.navy },
  rimDepth: 2,
  layers: [
    {
      rows: plot(56, (x, y) => {
        if (y < 12 || y > 44) return '.';
        const left = y > Math.abs(x - 13) * 0.85 + 15 && x < 28;
        const right = y > Math.abs(x - 43) * 0.85 + 13 && x > 27;
        if (!left && !right) return '.';
        return (x + y) % 7 < 2 ? 'W' : x < 28 ? 'A' : 'T';
      }),
    },
    {
      x: 18,
      y: 8,
      rows: [
        '......GG......',
        '....GGGGGG....',
        '..GGQQQQQQGG..',
        '.GQQNNNNNNQQG.',
        'GQNNNNNNNNNNQG',
        'NNNNNNNNNNNNNN',
        'NNNNNNNNNNNNNN',
      ],
    },
    { mirror: true, x: 20, y: 16, rows: ['NNNNN', 'NWWNN', 'NWKNN', '.NNN.', '..N..'] },
    { x: 25, y: 25, rows: ['..R.R..', '.RR.RR.', 'RR...RR', '.RR.RR.', '..RRR..', '...R...'] },
    {
      rows: plot(56, (x, y) => {
        if (y < 20 || y > 49 || x < 5 || x > 50) return '.';
        const diagonal = (x + y) % 11 === 0 || (x - y + 56) % 13 === 0;
        return diagonal ? ((x + y) % 2 ? 'V' : 'G') : '.';
      }),
    },
    {
      x: 18,
      y: 51,
      rows: ['..NNNNNNNNNNNNNNNN..', '.NNNNNNNNNNNNNNNNNN.', 'NNNNNNNNNNNNNNNNNNNN', 'KKKKKKKKKKKKKKKKKKKK'],
    },
  ],
};

export const KOSHINETSU: Readonly<Record<string, MonsterDesign>> = {
  'koshinetsu-islandboss-senrin-utsuro': senrinUtsuro,
};
