import { describe, expect, it } from 'vitest';

import { choicePayloadSchema } from '../../src/questions/renderers/choice/schema';
import { getChoicePromptSpeech } from '../../src/questions/renderers/choice/ChoiceView';
import { readUnitQuestionSets } from './questionSetFixture';

describe('choice question speech', () => {
  it('個数や図の特徴を説明する画像用テキストを読み上げに混ぜない', () => {
    for (const [unit, id] of [
      [['sansu', 'g1', 'kazu-100'], 'sansu.g1.kazu-100.count-0001'],
      [['sansu', 'g6', 'legacy-math-6-9'], 'legacy.sansu.g6.math-6-9.337d7e0826ac'],
      [['rika', 'g6', 'legacy-sci-6-7'], 'legacy.rika.g6.sci-6-7.084bcb4e54c9'],
    ] as const) {
      const question = readUnitQuestionSets<{ id: string; payload: unknown }>(...unit).find(
        (q) => q.id === id,
      )!;
      const payload = choicePayloadSchema.parse(question.payload);
      expect(payload.promptSpeech).toBeTruthy();
      expect(getChoicePromptSpeech(payload)).toBe(
        getChoicePromptSpeech({ ...payload, promptSpeech: undefined }),
      );
    }
  });
  it('画面に答えを出さず、指定した音声用テキストだけを読み上げられる', () => {
    const payload = choicePayloadSchema.parse({
      prompt: '🔊を押[お]して、聞[き]こえた文字[もじ]を選[えら]ぼう。',
      promptSpeech: 'B',
      choices: [
        { id: 'b', text: 'b' },
        { id: 'd', text: 'd' },
      ],
      answer: 'b',
      shuffle: false,
    });

    expect(payload.prompt).not.toContain('B');
    expect(getChoicePromptSpeech(payload)).toBe('B');
    expect(getChoicePromptSpeech({ ...payload, promptImage: 'letter.svg', promptAudio: 'b.mp3' })).toBe('B');
  });

  it('音声用テキストがない既存問題は、ルビを読みへ変換した問題文を読む', () => {
    const payload = choicePayloadSchema.parse({
      prompt: '日本[にほん]の首都[しゅと]は？',
      choices: [
        { id: 'tokyo', text: '東京[とうきょう]' },
        { id: 'osaka', text: '大阪[おおさか]' },
      ],
      answer: 'tokyo',
      shuffle: false,
    });

    expect(getChoicePromptSpeech(payload)).toBe('にほんのしゅとは？');
  });

  it('3年生の小文字問題は全26文字を、答えを見せずに聞き取らせる', () => {
    const questions = readUnitQuestionSets<{
      payload: { prompt: string; promptSpeech?: string };
    }>('eigo', 'g3', 'alphabet-small');

    expect(questions).toHaveLength(26);
    expect(questions.map(({ payload }) => payload.promptSpeech).join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    for (const { payload } of questions) {
      expect(payload.prompt).not.toContain(payload.promptSpeech);
      expect(payload.prompt).toContain('聞[き]こえた文字[もじ]');
    }
  });
});
