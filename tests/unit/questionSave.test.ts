import { describe, expect, it } from 'vitest';
import { replaceQuestionForSave } from '../../src/tools/questionSave';

const question = {
  id: 'eigo.g1.alphabet.0001',
  unit: 'eigo.g1.alphabet',
  subject: 'eigo',
  grade: 1,
  type: 'choice',
  payload: {
    prompt: '問題',
    choices: [
      { id: 'a', text: '答え' },
      { id: 'b', text: '違う' },
    ],
    answer: 'a',
  },
  extra: '保持',
};

describe('問題の保存準備', () => {
  it('対象の問題だけ置換し、その他のデータを保持する', () => {
    const other = { id: 'other', extra: true };
    const updated = { ...question, explanation: '解説' };
    expect(replaceQuestionForSave([question, other], [question, other], question.id, updated)).toEqual([
      updated,
      other,
    ]);
  });

  it('他の変更、ID 変更、単元と合わない学年、不正な内容を拒否する', () => {
    expect(() => replaceQuestionForSave([question], [], question.id, question)).toThrow(/変更/);
    expect(() =>
      replaceQuestionForSave([question], [question], question.id, { ...question, id: 'other' }),
    ).toThrow();
    expect(() =>
      replaceQuestionForSave([question], [question], question.id, { ...question, grade: 2 }),
    ).toThrow();
    expect(() =>
      replaceQuestionForSave([question], [question], question.id, { ...question, payload: {} }),
    ).toThrow();
  });

  it('選択式と記述式の変更は内容を検証して保存する', () => {
    const updated = { ...question, type: 'text-input', payload: { prompt: '問題', answers: ['答え'] } };
    expect(replaceQuestionForSave([question], [question], question.id, updated)).toEqual([updated]);
    expect(() =>
      replaceQuestionForSave([question], [question], question.id, { ...updated, payload: {} }),
    ).toThrow();
  });
});

it('saves random math rules, rejects impossible rules and non-math conversion, and keeps other questions', () => {
  const math = { ...question, id: 'sansu.g1.tashizan.test', unit: 'sansu.g1.tashizan', subject: 'sansu' };
  const payload = {
    prompt: 'たしざん',
    operation: 'add',
    leftMin: 1,
    leftMax: 9,
    rightMin: 1,
    rightMax: 9,
    carry: false,
    response: 'text-input',
  };
  const random = { ...math, type: 'random-calculation', payload };
  expect(replaceQuestionForSave([math, question], [math, question], math.id, random)).toEqual([
    random,
    question,
  ]);
  expect(replaceQuestionForSave([random], [random], math.id, math)).toEqual([math]);
  expect(() =>
    replaceQuestionForSave([math], [math], math.id, {
      ...random,
      payload: { ...payload, leftMin: 9, rightMin: 9 },
    }),
  ).toThrow();
  expect(() =>
    replaceQuestionForSave([question], [question], question.id, {
      ...question,
      type: 'random-calculation',
      payload,
    }),
  ).toThrow();
});
