/** 東海の地方ボス（手描き。docs/06 §4・§6.6 の規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';

const plot = (size: number, paint: (x: number, y: number) => string): string[] =>
  Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => paint(x, y)).join(''));

/** ナガレタエノミコト：四県を結ぶ水脈を体内で断ち切る巨大な水門竜。 */
const nagaretae: MonsterDesign = {
  size: 56,
  colors: {
    N: NQ.navy,
    B: NQ.blue,
    A: NQ.aqua,
    I: NQ.ice,
    W: NQ.white,
    G: NQ.gold,
    Q: NQ.ochre,
    R: NQ.red,
    V: NQ.violet,
    T: NQ.teal,
  },
  rim: { [NQ.blue]: NQ.navy, [NQ.aqua]: NQ.teal, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    {
      rows: plot(56, (x, y) => {
        if (y < 14 || y > 48) return '.';
        const wave = 27 + Math.sin((y - 8) / 5) * 12;
        const body = Math.abs(x - wave) < 8;
        return body ? ((x + y) % 7 < 2 ? 'I' : 'B') : '.';
      }),
    },
    {
      x: 12,
      y: 7,
      rows: [
        '..........GGGG..........',
        '.......GGGQQQQGGG.......',
        '....GGGQQNNNNQQGGG....',
        '..GGQQNNNNNNNNQQGG..',
        '.GQNNNNNNNNNNNNNNQG.',
        'NNNNNNNNNNNNNNNNNNNN',
      ],
    },
    { mirror: true, x: 16, y: 15, rows: ['NNNNNN', 'NWWNNN', 'NWRNNN', '.NNNN.', '..NN..'] },
    { x: 22, y: 24, rows: ['NNNNNNNNNNNN', 'NAA.NAA.NAAN', 'NAA.NAA.NAAN', 'NRR.NRR.NRRN', 'NNNNNNNNNNNN'] },
    {
      rows: plot(56, (x, y) => {
        if (y < 29 || y > 47) return '.';
        const streams = [8, 18, 38, 48];
        return streams.some((cx, i) => Math.abs(x - cx - Math.sin((y + i) / 3) * 2) < 1.3)
          ? (x + y) % 3 === 0
            ? 'A'
            : 'I'
          : '.';
      }),
    },
    {
      x: 14,
      y: 51,
      rows: [
        '....BBBBBBBBBBBBBBBB....',
        '..BBBBBBBBBBBBBBBBBBBB..',
        '.NNNNNNNNNNNNNNNNNNNNNN.',
        'NNNNNNNNNNNNNNNNNNNNNNNN',
      ],
    },
  ],
};

export const TOKAI: Readonly<Record<string, MonsterDesign>> = {
  'tokai-islandboss-nagaretae': nagaretae,
};
