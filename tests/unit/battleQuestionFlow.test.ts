// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type * as QuestionEngine from '../../src/questions/engine';
import { runBattleQuestion } from '../../src/scenes/battle/questionFlow';

const mocks = vi.hoisted(() => ({ ask: vi.fn() }));
vi.mock('../../src/questions/engine', async (importOriginal) => ({
  ...(await importOriginal<typeof QuestionEngine>()),
  ask: mocks.ask,
}));
vi.mock('../../src/scenes/shared/askEnv', () => ({ buildAskEnv: vi.fn(() => ({})) }));

describe('battle question timing', () => {
  it('解説を見る時間を含めずレンダラーの回答時間を使う', async () => {
    mocks.ask.mockResolvedValue({ score: 1, timeMs: 2_000, attempts: 1 });
    const hide = vi.fn();
    const result = await runBattleQuestion({
      query: { subject: 'sansu', gradeRange: [1, 3] },
      title: '',
      subject: 'sansu',
      hint: '',
      game: {} as never,
      content: {} as never,
      bank: {} as never,
      mastery: {} as never,
      rng: { next: () => 0 },
      speak: () => {},
      port: { show: vi.fn(), hide },
      getGame: () => ({}) as never,
    });
    expect(result).toEqual({ score: 1, timeMs: 2_000, attempts: 1 });
    expect(hide).toHaveBeenCalledOnce();
  });
});
