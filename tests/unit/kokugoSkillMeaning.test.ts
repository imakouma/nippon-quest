import { expect, it } from 'vitest';
import assignments from '../../content/kokugo-skill-assignments.json';

it('文法、読解、作文、語彙を内容に合う技へ割り当てる', () => {
  const table: Readonly<Record<string, string>> = assignments;
  expect(table['legacy.kokugo.g1.jpn-1-3.5a0da1ada651']).toBe('sk-bun-no-tsubasa');
  expect(table['legacy.kokugo.g1.jpn-1-3.0f1682126b5b']).toBe('sk-bun-no-tsubasa');
  expect(table['legacy.kokugo.g1.jpn-1-3.7fe1fb6ce079']).toBe('sk-bun-no-tsubasa');
  expect(table['legacy.kokugo.g1.jpn-1-4.e1e0a6a0dfc6']).toBe('sk-kokugo-1-express');
  expect(table['legacy.kokugo.g2.jpn-2-3.1810bf465df2']).toBe('sk-kokugo-2-sentence');
  expect(table['legacy.kokugo.g2.jpn-2-1.4e449424655b']).toBe('sk-kokugo-2-kanji-parts');
  expect(table['legacy.kokugo.g2.jpn-2-2.865662a4a644']).toBe('sk-kokugo-2-readkanji');
  expect(table['source.kokugo.g2.jpn-2-2.5b59d7a34044']).toBe('sk-kokugo-2-writekanji');
  expect(table['legacy.kokugo.g2.jpn-2-5.07a69da44386']).toBe('sk-kokugo-2-sentence');
  expect(table['legacy.kokugo.g3.jpn-3-4.1bc2578e027c']).toBe('sk-kokugo-3-reading');
  expect(table['legacy.kokugo.g3.jpn-3-4.6c6faa38d290']).toBe('sk-kokugo-3-reading');
  expect(table['legacy.kokugo.g3.jpn-3-2.5e54c6a179af']).toBe('sk-kokugo-3-kanji-parts');
  expect(table['legacy.kokugo.g3.jpn-3-9.acc6593c1eb9']).toBe('sk-kokugo-3-writekanji');
  expect(table['legacy.kokugo.g3.jpn-3-4.3db9ddb200e1']).toBe('sk-kokugo-3-sentence');
  expect(table['legacy.kokugo.g3.jpn-3-5.6c0982d8db5a']).toBe('sk-kokugo-3-words');
  expect(table['legacy.kokugo.g4.jpn-4-2.05e003899b84']).toBe('sk-kokugo-4-sentence');
  expect(table['legacy.kokugo.g4.jpn-4-2.7743f367b251']).toBe('sk-kokugo-4-sentence');
  expect(table['legacy.kokugo.g4.jpn-4-5.7d20c4dc85e8']).toBe('sk-kokugo-4-express');
  expect(table['legacy.kokugo.g4.jpn-4-31.e392172ca672']).toBe('sk-kokugo-4-reading');
  expect(table['legacy.kokugo.g4.jpn-4-40.8a4784d5eb93']).toBe('sk-kokugo-4-reading');
  expect(table['legacy.kokugo.g4.jpn-4-35.f86da340802e']).toBe('sk-kokugo-4-words');
  expect(table['legacy.kokugo.g4.jpn-4-32.6b30823de3da']).toBe('sk-kokugo-4-reading');
  expect(table['legacy.kokugo.g3.jpn-3-7.530cc8361ed8']).toBe('sk-kokugo-3-reading');
  expect(table['legacy.kokugo.g3.jpn-3-7.98feb53edf80']).toBe('sk-kokugo-3-reading');
  expect(table['legacy.kokugo.g4.jpn-4-40.8a4784d5eb93']).toBe('sk-kokugo-4-reading');
  expect(table['legacy.kokugo.g3.jpn-3-4.6c6faa38d290']).toBe('sk-kokugo-3-reading');
  expect(table['legacy.kokugo.g3.jpn-3-20.4088987de6cc']).toBe('sk-kokugo-3-words');
  expect(table['legacy.kokugo.g4.jpn-4-29.090bb8d834b4']).toBe('sk-kokugo-4-readkanji');
  expect(table['source.kokugo.g5.jpn-5-3.b8fc84548a85']).toBe('sk-kokugo-5-express');
  expect(table['legacy.kokugo.g6.jpn-6-4.55954b3412ec']).toBe('sk-kokugo-6-express');
  expect(table['legacy.kokugo.g6.jpn-6-4.a756b80a9e2f']).toBe('sk-kokugo-6-reading');
});

it('指示語は語彙、発表・引用・推敲は表現の技に割り当てる', () => {
  const table: Readonly<Record<string, string>> = assignments;
  expect(table['legacy.kokugo.g3.jpn-3-4.0c2791c7cc12']).toBe('sk-kokugo-3-words');
  expect(table['legacy.kokugo.g3.jpn-3-4.2cca79eaec89']).toBe('sk-kokugo-3-words');
  expect(table['kokugo.g5.discussion-and-listening.0005']).toBe('sk-kokugo-5-express');
  expect(table['kokugo.g5.writing-with-evidence.0004']).toBe('sk-kokugo-5-express');
  expect(table['kokugo.g5.writing-with-evidence.0005']).toBe('sk-kokugo-5-express');
});
