/** 北陸の地方ボス（手描き。docs/06 §4・§6.6 の規格） */
import { NQ } from '../palette';
import type { MonsterDesign } from './design';

const plot = (size: number, paint: (x: number, y: number) => string): string[] =>
  Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => paint(x, y)).join(''));

const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number): number =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;

/** カガミウツシノミコト：四県の水流を脚にし、欠けた記録を偽の像で埋める巨大な水鏡。 */
const kagamiutsushi: MonsterDesign = {
  size: 56,
  colors: {
    A: NQ.aqua,
    S: NQ.sky,
    I: NQ.ice,
    W: NQ.white,
    B: NQ.blue,
    N: NQ.navy,
    G: NQ.gold,
    Q: NQ.ochre,
    V: NQ.violet,
    R: NQ.red,
  },
  rim: { [NQ.aqua]: NQ.sky, [NQ.sky]: NQ.azure, [NQ.gold]: NQ.ochre },
  rimDepth: 2,
  layers: [
    // 鏡の背後から流れる四本の水。北陸四県に残る独立した痕跡を表す
    {
      rows: plot(56, (x, y) => {
        if (y < 27 || y > 54) return '.';
        const streams = [8, 18, 37, 47];
        const hit = streams.some(
          (base, index) => Math.abs(x - (base + Math.sin((y + index * 3) / 4) * 3)) < 2.2,
        );
        return hit ? ((x + y) % 5 < 2 ? 'I' : 'A') : '.';
      }),
    },
    // 金の鏡枠と、水色の鏡面
    {
      rows: plot(56, (x, y) => {
        const d = ellipse(x, y, 27.5, 27, 21, 24);
        if (d > 1) return '.';
        if (d > 0.78) return (x + y) % 7 < 4 ? 'G' : 'Q';
        if ((x < 19 && y > 19 && y < 29) || (x > 35 && y > 31 && y < 41)) return '.';
        return (x * 2 + y * 3) % 13 < 3 ? 'I' : 'S';
      }),
    },
    // 鏡に映る偽の顔。左右で表情が違い、中央のひびで分断される
    { mirror: true, x: 16, y: 21, rows: ['WWWW', 'WBBW', 'WBoW', '.NN.'] },
    { x: 25, y: 29, rows: ['.N...N.', '..N.N..', '...N...', '..N.N..', '.N...N.'] },
    { x: 22, y: 37, rows: ['NN........NN', '.NN......NN.', '..NNNNNNNN..', '...NNNNNN...'] },
    // 欠けた場所を覆う、根拠のない紫の「完成形」と赤い警告印
    { x: 9, y: 20, rows: ['..VVV', '.VVVV', 'VVVRR', '.VVRR', '..VRR'] },
    { x: 39, y: 34, rows: ['RRV..', 'RRVV.', 'RVVVV', '.VVVV', '..VVV'] },
    // 足もとは四本の水流が一つになった台座
    {
      x: 14,
      y: 50,
      rows: [
        '....BBBBBBBBBBBBBBBB....',
        '..BBBBBBBBBBBBBBBBBBBB..',
        '.NNNNNNNNNNNNNNNNNNNNNN.',
        'NNNNNNNNNNNNNNNNNNNNNNNN',
        'NNNNNNNNNNNNNNNNNNNNNNNN',
        'oooooooooooooooooooooooo',
      ],
    },
  ],
};

export const HOKURIKU: Readonly<Record<string, MonsterDesign>> = {
  'hokuriku-islandboss-kagamiutsushi': kagamiutsushi,
};
