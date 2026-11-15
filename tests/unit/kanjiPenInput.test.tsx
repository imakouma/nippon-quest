// @vitest-environment jsdom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TraceCanvas } from '../../src/questions/renderers/kanji-trace/TraceCanvas';
import { gradeOneWriting } from '../../src/questions/renderers/kanji-trace/writingAssessment';
import type { RendererContext } from '../../src/questions/contracts';
import { setDictionary } from '../../src/ui/i18n';
import dictionary from '../../content/i18n/ja.json';

type Point = { x: number; y: number };
for (const name of [
  'onpointerdown',
  'onpointermove',
  'onpointerup',
  'onpointercancel',
  'onlostpointercapture',
]) {
  if (!(name in HTMLElement.prototype))
    Object.defineProperty(HTMLElement.prototype, name, { value: null, writable: true, configurable: true });
}
beforeEach(() => {
  setDictionary(dictionary);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

function setup(kanji = '一') {
  const root = document.createElement('div');
  document.body.append(root);
  const onSubmit = vi.fn();
  const onAttempt = vi.fn();
  const ctx: RendererContext = {
    container: root,
    grade: 1,
    timeLimitMs: 60000,
    question: {
      id: 'pen.test',
      type: 'kanji-trace',
      subject: 'kokugo',
      grade: 1,
      unit: 'kokugo.g1.kanji',
      payload: {},
    },
    assets: { image: (path) => path, audio: (path) => path },
    speak: () => undefined,
  };
  act(() =>
    render(
      <TraceCanvas
        payload={{ mode: 'trace', kanji, reading: 'いち' }}
        ctx={ctx}
        disabled={false}
        onAttempt={onAttempt}
        onSubmit={onSubmit}
      />,
      root,
    ),
  );
  const canvas = root.querySelector('canvas')!;
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 240,
    height: 240,
  } as DOMRect);
  const clear = root.querySelector<HTMLButtonElement>('.nq-kt-actions button')!;
  const submit = () =>
    act(() => {
      root.querySelector<HTMLButtonElement>('.nq-kt-submit')!.click();
    });
  const event = (type: string, point: Point, props: Record<string, unknown> = {}) => {
    const next = new MouseEvent(type, {
      bubbles: true,
      clientX: point.x * 240,
      clientY: point.y * 240,
      button: 0,
    });
    for (const [key, value] of Object.entries({
      pointerId: 7,
      pointerType: 'pen',
      pressure: 0.5,
      getCoalescedEvents: () => [],
      ...props,
    }))
      Object.defineProperty(next, key, { value });
    return next;
  };
  const send = (type: string, point: Point, props: Record<string, unknown> = {}) =>
    act(() => {
      canvas.dispatchEvent(event(type, point, props));
    });
  const write = (pressure: number, coalesced = false, interrupt = false) => {
    for (const stroke of gradeOneWriting[kanji]!) {
      const first = stroke.points[0]!;
      const last = stroke.points.at(-1)!;
      send('pointerdown', first, { pressure });
      if (interrupt) {
        send('pointerdown', { x: 0, y: 0 }, { pointerId: 99, pointerType: 'touch' });
        send('pointermove', { x: 1, y: 1 }, { pointerId: 99, pointerType: 'touch' });
        send('pointerup', { x: 1, y: 1 }, { pointerId: 99, pointerType: 'touch', pressure: 0 });
      }
      if (coalesced)
        send('pointermove', last, {
          pressure,
          getCoalescedEvents: () => stroke.points.slice(1).map((p) => event('pointermove', p, { pressure })),
        });
      else for (const point of stroke.points.slice(1)) send('pointermove', point, { pressure });
      send('pointerup', last, { pressure: 0 });
      send('lostpointercapture', last, { pressure: 0 });
    }
    submit();
  };
  return { root, clear, onSubmit, send, write };
}

describe('synthetic pen input (not physical device calibration)', () => {
  it.each([0, 0.02, 0.5, 1])(
    'accepts the same character at pressure %s and pressure zero on lift',
    (pressure) => {
      const { write, onSubmit } = setup();
      write(pressure);
      expect(onSubmit).toHaveBeenCalledWith(1, 1);
    },
  );
  it('keeps the hook and curved strokes when the browser batches pen movement', () => {
    const { write, onSubmit } = setup('水');
    write(0.4, true);
    expect(onSubmit).toHaveBeenCalledWith(1, 1);
  });
  it('ignores a second touch while the pen is writing', () => {
    const { write, onSubmit } = setup();
    write(0.4, false, true);
    expect(onSubmit).toHaveBeenCalledWith(1, 1);
  });
  it.each(['pointercancel', 'lostpointercapture'])(
    'recovers after %s without keeping the unfinished stroke',
    (type) => {
      const { send, clear, write, onSubmit } = setup();
      send('pointerdown', { x: 0.2, y: 0.3 });
      send('pointermove', { x: 0.3, y: 0.4 });
      send(type, { x: 0.3, y: 0.4 });
      expect(clear.disabled).toBe(true);
      write(0.3);
      expect(onSubmit).toHaveBeenCalledWith(1, 1);
    },
  );
  it('does not create ink from hover or barrel-button input', () => {
    const { send, clear } = setup();
    send('pointermove', { x: 0.4, y: 0.4 }, { pressure: 0 });
    send('pointerdown', { x: 0.4, y: 0.4 }, { button: 2 });
    expect(clear.disabled).toBe(true);
  });
});
