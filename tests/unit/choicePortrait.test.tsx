// @vitest-environment jsdom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { ChoiceView } from '../../src/questions/renderers/choice/ChoiceView';
import type { RendererContext } from '../../src/questions/contracts';

afterEach(() => render(null, document.body));
it('marks long prose for a portrait row without counting ruby annotations as visible text', () => {
  const ctx = {
    question: { id: 'test', subject: 'shakai', grade: 5 },
    grade: 5,
    timeLimitMs: 0,
    assets: { image: (s: string) => s },
    speak: vi.fn(),
  } as unknown as RendererContext;
  for (const [text, long] of [
    ['水[みず]と電気[でんき]', false],
    ['工場が海外へ移り、国内の産業が衰えてしまうこと。', true],
  ] as const) {
    const payload = {
      prompt: '選ぼう',
      choices: [
        { id: 'a', text },
        { id: 'b', text: '別の答え' },
      ],
      answer: 'a',
      shuffle: false,
    };
    act(() => render(h(ChoiceView, { ctx, payload, order: ['a', 'b'], onDone: vi.fn() }), document.body));
    expect(document.querySelector('.nq-q-choices')!.classList.contains('nq-q-choices-prose')).toBe(long);
  }
});
