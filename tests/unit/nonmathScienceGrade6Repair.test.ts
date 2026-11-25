import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
type ScienceQuestion = {
  id: string;
  payload: { prompt: string; choices: { id: string; text: string }[]; answer: string; answers: string[] };
  explanation: string;
};
const questions: ScienceQuestion[] = Array.from({ length: 10 }, (_, i) =>
  JSON.parse(readFileSync(resolve(`content/questions/rika/g6/legacy-sci-6-${i + 1}/set-001.json`), 'utf8')),
).flat();
const question = (suffix: string) => questions.find((q) => q.id.endsWith(`.${suffix}`))!;
const plain = (text: string) => text.replace(/\[[^\]]+\]/g, '');
describe('grade 6 science repaired conditions', () => {
  it.each([
    '2876b85e3359',
    '5c58c7cd2e5e',
    'a44466a59382',
    'b8281e87c6a4',
    'd0e4e8377692',
    'df1353230088',
    'e9aed81fb70c',
    '086af74e9588',
    '7497123839a5',
    'b4b5e6710b3a',
    'cb597db6c31f',
    'cd7415be64e8',
    '18be942bf0fb',
    '96947509b9a3',
    'd0359358354a',
    '227b01b05bed',
    '5f84e1b5ebb3',
    '68877e7d8924',
    'a725e31255bb',
    '17c8f1887fa9',
    '1e13766f103a',
    '2030558536f0',
    '45157ae4cc2a',
    '608f54b9ce06',
    '760df5015e63',
    'cf16345b7238',
    'fae23d61eeab',
    'ff8e66205d03',
    'aae4275b5ce0',
  ])('%s supplies every numbered blank in the question', (id) => {
    const q = question(id);
    const count = q.payload.choices.find((c) => c.id === q.payload.answer)!.text.split('・').length;
    const blanks = [...q.payload.prompt.matchAll(/[①②③④⑤⑥]/g)].map((m) => m[0]);
    for (const digit of '①②③④⑤⑥'.slice(0, count)) expect(blanks).toContain(digit);
  });
  it.each([
    ['978e2e27fb66', 60, [1, 2, 3, 6]],
    ['d3947df3e5e0', 120, [1, 2, 3, 4, 6]],
  ] as const)('%s limits weights so excluded positions cannot balance', (id, torque, positions) => {
    const q = question(id);
    expect(plain(q.payload.prompt)).toContain('10gのおもりだけ');
    const possible = [1, 2, 3, 4, 5, 6].filter((p) => (torque / p) % 10 === 0);
    expect(possible).toEqual(positions);
    expect(q.payload.answers.map(Number)).toEqual(positions.map((p) => torque / p));
  });
  it('asks about a second candle after the first is extinguished without replacing air', () => {
    const p = plain(question('e17bbc6674a9').payload.prompt);
    expect(p).toContain('空気を入れかえず');
    expect(p).toContain('別の');
  });
  it('identifies the leaf as the target inferred from the paired bag experiment', () => {
    const p = plain(question('5354ddf190dc').payload.prompt);
    expect(p).toContain('A');
    expect(p).toContain('B');
    expect(p).toContain('どの部分');
  });
  it('does not infer a CO2 increase from only the post-combustion limewater observation', () => {
    const q = question('ff109f778631');
    const answer = q.payload.choices.find((c) => c.id === q.payload.answer)!.text;
    expect(plain(answer)).toContain('ふくまれている');
    expect(plain(q.explanation)).not.toContain('増えたと判断');
  });
  it('names all six solutions and the evaporated residue as the question target', () => {
    const p = plain(question('06c8ba200cc6').payload.prompt);
    for (const text of ['塩酸', '炭酸水', '食塩水', 'アンモニア水', '重そう水', '石灰水', '固体'])
      expect(p).toContain(text);
  });
  it('asks which pipette operation is incorrect', () => {
    expect(plain(question('180e0fa0d772').payload.prompt)).toContain('まちがっている');
  });
});
