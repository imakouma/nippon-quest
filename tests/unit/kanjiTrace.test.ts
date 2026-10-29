// @vitest-environment jsdom

import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QuestionResult } from '../../src/questions/contracts';
import { QuestionBank } from '../../src/questions/engine/bank';
import { filterCandidates } from '../../src/questions/engine/pick';
import { kanjiTraceRenderer } from '../../src/questions/renderers/kanji-trace';
import {
  kanjiTracePayloadSchema,
  rasterizeStrokes,
  traceMatch,
  traceScore,
} from '../../src/questions/renderers/kanji-trace/schema';
import { getRenderer } from '../../src/questions/renderers/registry';
import { setDictionary } from '../../src/ui/i18n';
import aomori from '../../content/prefectures/aomori.json';
import gradeOneQuestions from '../../content/questions/kokugo/g1/kanji-trace.json';
import gradeTwoQuestions from '../../content/questions/kokugo/g2/kanji-trace.json';

const yama = [
  [
    { x: 0.5, y: 0.1 },
    { x: 0.5, y: 0.85 },
  ],
  [
    { x: 0.2, y: 0.35 },
    { x: 0.2, y: 0.85 },
    { x: 0.8, y: 0.85 },
  ],
  [
    { x: 0.8, y: 0.35 },
    { x: 0.8, y: 0.85 },
  ],
];

describe('kanji-trace scoring', () => {
  const guide = rasterizeStrokes(yama, undefined, 2);
  const score = (strokes: typeof yama) => traceScore(traceMatch(guide, rasterizeStrokes(strokes)).match);

  it('gives full credit to an accurate or slightly shifted trace', () => {
    expect(score(yama)).toBe(1);
    expect(
      score(yama.map((stroke) => stroke.map((point) => ({ x: point.x + 0.03, y: point.y - 0.02 })))),
    ).toBe(1);
  });

  it('does not reward filling, a partial trace, or unrelated ink', () => {
    const fill = Array.from({ length: 10 }, (_, index) => [
      { x: 0.05, y: 0.05 + index * 0.1 },
      { x: 0.95, y: 0.05 + index * 0.1 },
    ]);
    expect(traceMatch(guide, rasterizeStrokes(fill)).recall).toBe(1);
    expect(score(fill)).toBeLessThan(0.5);
    expect(score([yama[0]!])).toBeLessThan(0.5);
    expect(
      score([
        [
          { x: 0.05, y: 0.05 },
          { x: 0.3, y: 0.05 },
        ],
      ]),
    ).toBe(0);
  });

  it('maps match 0.3 to zero, 0.5 to half, and 0.7 to full credit', () => {
    expect(traceScore(0.3)).toBe(0);
    expect(traceScore(0.5)).toBeCloseTo(0.5);
    expect(traceScore(0.7)).toBe(1);
    expect(traceMatch(new Uint8Array(4), new Uint8Array(4), 2).match).toBe(0);
  });
});

describe('kanji-trace schema and registration', () => {
  it('defaults to trace mode and rejects invalid reading choices or multi-character kanji', () => {
    expect(kanjiTracePayloadSchema.parse({ kanji: '山', reading: 'やま' }).mode).toBe('trace');
    expect(() =>
      kanjiTracePayloadSchema.parse({
        mode: 'reading',
        kanji: '山',
        reading: 'やま',
        choices: ['かわ', 'いし'],
        answer: 'やま',
      }),
    ).toThrow();
    expect(() => kanjiTracePayloadSchema.parse({ kanji: '山川', reading: 'やまかわ' })).toThrow();
  });

  it('registers the renderer', () => expect(getRenderer('kanji-trace')).toBe(kanjiTraceRenderer));
});

describe('kanji-trace content integration', () => {
  it('lets the Osorezan event select the three tagged kanji questions', async () => {
    const area = aomori as {
      events: { id: string; question?: { type?: string; tags?: string[] } }[];
    };
    const event = area.events.find(({ id }) => id === 'aomori-ev-osorezan');
    expect(event?.question).toMatchObject({ type: 'kanji-trace', tags: ['theme:osorezan'] });

    const files = new Map<string, unknown>([
      ['questions/kokugo/g1/kanji-trace.json', gradeOneQuestions],
      ['questions/kokugo/g2/kanji-trace.json', gradeTwoQuestions],
    ]);
    const { bank, report } = await QuestionBank.load([...files.keys()], async (file) => files.get(file));
    expect(report.skipped).toEqual([]);
    expect(
      filterCandidates(bank, {
        subject: 'kokugo',
        gradeRange: [1, 2],
        type: 'kanji-trace',
        tags: ['theme:osorezan'],
      }).map(({ id }) => id),
    ).toEqual(['kokugo.g1.kanji-trace.0001', 'kokugo.g1.kanji-trace.0002', 'kokugo.g2.kanji-trace.0001']);
  });
});

describe('kanji-trace renderer', () => {
  for (const name of ['onpointerdown', 'onpointermove', 'onpointerup', 'onpointercancel', 'onpointerleave'])
    if (!(name in HTMLElement.prototype))
      Object.defineProperty(HTMLElement.prototype, name, { value: null, writable: true, configurable: true });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    setDictionary({
      question: {
        speak: 'よみあげ',
        remainingTime: 'のこり {n} びょう',
        kanjiTracePrompt: 'うすい 字[じ]を なぞろう',
        kanjiTraceReadingPrompt: 'よみは？',
        kanjiTraceStrokes: '（{n}かく）',
        kanjiTraceCanvas: '「{kanji}」を なぞる ところ',
        kanjiTraceClear: 'けす',
        kanjiTraceDone: 'できた',
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  function mount(payload: unknown, signal?: AbortSignal) {
    const container = document.createElement('div');
    document.body.append(container);
    let result!: Promise<QuestionResult>;
    act(() => {
      result = kanjiTraceRenderer.mount({
        container,
        question: {
          id: 'kokugo.g1.test.0001',
          type: 'kanji-trace',
          subject: 'kokugo',
          grade: 1,
          unit: 'kokugo.g1.test',
          payload,
        },
        grade: 1,
        assets: { image: (path) => path, audio: (path) => path },
        speak: () => undefined,
        timeLimitMs: 60_000,
        signal,
      });
    });
    return { container, result };
  }

  it('supports touch pointer drawing, clear, submission, and RubyText hints', async () => {
    const { container, result } = mount({
      kanji: '山',
      reading: 'やま',
      hintWord: '山[やま]',
      strokeCount: 3,
    });
    expect(container.querySelector('.nq-kt-hint ruby')?.textContent).toBe('山やま');
    const [clear, done] = [...container.querySelectorAll<HTMLButtonElement>('.nq-kt-actions button')];
    const canvas = container.querySelector('canvas')!;
    const touch = (type: string, init: MouseEventInit = {}) => {
      const event = new MouseEvent(type, { ...init, bubbles: true });
      Object.defineProperties(event, {
        pointerId: { value: 1 },
        pointerType: { value: 'touch' },
      });
      return event;
    };
    expect(done!.disabled).toBe(true);
    act(() => {
      canvas.dispatchEvent(touch('pointerdown', { clientX: 5, clientY: 5 }));
      canvas.dispatchEvent(touch('pointerup'));
    });
    expect(done!.disabled).toBe(false);
    act(() => clear!.click());
    expect(done!.disabled).toBe(true);
    act(() => {
      canvas.dispatchEvent(touch('pointerdown', { clientX: 5, clientY: 5 }));
    });
    expect(done!.disabled).toBe(false);
    act(() => done!.click());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    await expect(result).resolves.toMatchObject({ score: 1, attempts: 1, timedOut: false });
  });

  it('scores reading choices and aborts immediately during feedback', async () => {
    const controller = new AbortController();
    const { container, result } = mount(
      { mode: 'reading', kanji: '石', reading: 'いし', choices: ['いし', 'いわ'], answer: 'いし' },
      controller.signal,
    );
    act(() => {
      [...container.querySelectorAll<HTMLButtonElement>('.nq-choice')]
        .find((button) => button.textContent?.includes('いし'))!
        .click();
      controller.abort();
    });
    await act(async () => Promise.resolve());
    await expect(result).resolves.toMatchObject({ score: 0, attempts: 0, timedOut: true });
  });

  it('resolves an already-aborted signal without waiting for feedback', async () => {
    const controller = new AbortController();
    controller.abort();
    const { result } = mount({ kanji: '山', reading: 'やま' }, controller.signal);
    await act(async () => Promise.resolve());
    await expect(result).resolves.toMatchObject({ score: 0, attempts: 0, timedOut: true });
  });
});
