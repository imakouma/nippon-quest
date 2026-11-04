// @vitest-environment jsdom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuestionBase } from '../../src/questions/contracts';
import { questionTimeLimitMs } from '../../src/questions/engine/timeLimit';
import { TimerBar } from '../../src/questions/renderers/shared/TimerBar';

const question: QuestionBase = {
  id: 'sansu.g1.test.1',
  type: 'text-input',
  subject: 'sansu',
  grade: 1,
  unit: 'sansu.g1.test',
  payload: { prompt: '短い問題', answers: ['1'] },
};

describe('question timing', () => {
  it('算数のバトルで文章量と入力数に応じて時間を増やす', () => {
    const short = questionTimeLimitMs(question, 20, true, false);
    const long = questionTimeLimitMs(
      { ...question, payload: { prompt: '長い問題'.repeat(30), answers: ['1', '2'] } },
      20,
      true,
      false,
    );
    expect(short).toBeGreaterThanOrEqual(20_000);
    expect(long).toBeGreaterThan(short);
  });
  it('明示時間と対象外の問題を維持し、練習の無制限を選べる', () => {
    expect(questionTimeLimitMs({ ...question, timeLimitSec: 12 }, 20, true, false)).toBe(12_000);
    expect(questionTimeLimitMs({ ...question, subject: 'kokugo' }, 20, true, false)).toBe(20_000);
    expect(questionTimeLimitMs({ ...question, grade: 4 }, 20, true, false)).toBe(20_000);
    expect(questionTimeLimitMs(question, 20, false, false)).toBe(20_000);
    expect(questionTimeLimitMs({ ...question, timeLimitSec: 12 }, 20, false, true)).toBe(0);
  });
  it('制限ありのタイマーは停止中に発火せず、稼働中は一度だけ発火する', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    act(() => render(h(TimerBar, { ms: 1000, running: false, onTimeout }), document.body));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
    act(() => render(h(TimerBar, { ms: 1000, running: true, onTimeout }), document.body));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
  afterEach(() => {
    render(null, document.body);
    vi.useRealTimers();
  });
  it('無制限はタイマーを表示せず時間切れにしない', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    act(() => render(h(TimerBar, { ms: 0, running: true, onTimeout }), document.body));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
    expect(document.querySelector('[role=progressbar]')).toBeNull();
  });
});
