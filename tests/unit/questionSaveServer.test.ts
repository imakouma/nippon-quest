import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { saveQuestion } from '../../scripts/question-save-server';

const root = mkdtempSync(join(tmpdir(), 'nq-question-save-'));
const file = 'questions/eigo/g1/alphabet/set-001.json';
const path = join(root, 'content', file);
const original = {
  id: 'eigo.g1.alphabet.0001',
  unit: 'eigo.g1.alphabet',
  subject: 'eigo',
  grade: 1,
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
  mkdirSync(join(root, 'content/questions/eigo/g1/alphabet'), { recursive: true });
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
  const kanji = { ...original, id: 'kokugo.g1.kanji.0001', subject: 'kokugo', unit: 'kokugo.g1.kanji' };
  mkdirSync(join(root, 'content/questions/kokugo/g1'), { recursive: true });
  writeFileSync(kanjiPath, JSON.stringify([kanji]));
  const changed = { ...kanji, explanation: '解説' };
  saveQuestion(root, { file: kanjiFile, expected: [kanji], id: kanji.id, question: changed });
  expect(JSON.parse(readFileSync(kanjiPath, 'utf8'))).toEqual([changed]);
});

it('ランダム計算の条件をファイルへ保存し、不正な更新で保存済みデータを壊さない', () => {
  const mathFile = 'questions/sansu/g1/tashizan/set-002.json';
  const mathPath = join(root, 'content', mathFile);
  const math = {
    ...original,
    id: 'sansu.g1.tashizan.random.0001',
    subject: 'sansu',
    unit: 'sansu.g1.tashizan',
  };
  mkdirSync(join(root, 'content/questions/sansu/g1/tashizan'), { recursive: true });
  writeFileSync(mathPath, JSON.stringify([math]));
  const random = {
    ...math,
    type: 'random-calculation',
    payload: {
      prompt: 'たしざん',
      operation: 'add',
      leftMin: 1,
      leftMax: 9,
      rightMin: 1,
      rightMax: 9,
      carry: true,
      response: 'choice',
    },
  };
  saveQuestion(root, { file: mathFile, expected: [math], id: math.id, question: random });
  expect(JSON.parse(readFileSync(mathPath, 'utf8'))).toEqual([random]);
  expect(() =>
    saveQuestion(root, {
      file: mathFile,
      expected: [random],
      id: math.id,
      question: { ...random, payload: { ...random.payload, leftMax: 2, rightMax: 2 } },
    }),
  ).toThrow();
  expect(JSON.parse(readFileSync(mathPath, 'utf8'))).toEqual([random]);
});
