import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { saveQuestion } from '../../scripts/question-save-server';

const root = mkdtempSync(join(tmpdir(), 'nq-question-save-'));
const file = 'questions/eigo/g3/alphabet-small/set-001.json';
const path = join(root, 'content', file);
const original = {
  id: 'eigo.g3.alphabet-small.0001',
  unit: 'eigo.g3.alphabet-small',
  subject: 'eigo',
  grade: 3,
  type: 'choice',
  payload: {
    prompt: '問題',
    choices: [
      { id: 'a', text: '正解' },
      { id: 'b', text: '不正解' },
    ],
    answer: 'a',
  },
};
afterEach(() => rmSync(root, { recursive: true, force: true }));

it('保存して再読込でき、競合や不正な保存先は拒否する', () => {
  mkdirSync(join(root, 'content/questions/eigo/g3/alphabet-small'), { recursive: true });
  writeFileSync(path, JSON.stringify([original]));
  const changed = { ...original, explanation: '解説' };
  saveQuestion(root, { file, expected: [original], id: original.id, question: changed });
  expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual([changed]);
  expect(() =>
    saveQuestion(root, { file, expected: [original], id: original.id, question: original }),
  ).toThrow(/変更/);
  expect(() =>
    saveQuestion(root, { file: '../outside.json', expected: [], id: original.id, question: original }),
  ).toThrow();
  expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual([changed]);
});

it('共有側で追加された漢字問題ファイルも保存できる', () => {
  const kanjiFile = 'questions/kokugo/g1/kanji-trace.json';
  const kanjiPath = join(root, 'content', kanjiFile);
  const kanji = {
    ...original,
    id: 'kokugo.g1.kanji.0001',
    subject: 'kokugo',
    grade: 1,
    unit: 'kokugo.g1.kanji',
  };
  mkdirSync(join(root, 'content/questions/kokugo/g1'), { recursive: true });
  writeFileSync(kanjiPath, JSON.stringify([kanji]));
  const changed = { ...kanji, explanation: '解説' };
  saveQuestion(root, { file: kanjiFile, expected: [kanji], id: kanji.id, question: changed });
  expect(JSON.parse(readFileSync(kanjiPath, 'utf8'))).toEqual([changed]);
});
