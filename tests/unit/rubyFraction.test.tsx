// @vitest-environment jsdom
import { h, render } from 'preact';
import { afterEach, expect, it } from 'vitest';
import { RubyLabel } from '../../src/ui/RubyLabel';

afterEach(() => render(null, document.body));

it('renders fractions in prompts and options with a readable accessible name', () => {
  render(h(RubyLabel, { text: '左の \\dfrac{1}{4} と \\dfrac{10}{10}。漢字[かんじ]' }), document.body);
  const fractions = document.querySelectorAll('[aria-label]');
  expect([...fractions].map((item) => item.getAttribute('aria-label'))).toEqual(['4分の1', '10分の10']);
  expect(document.body.textContent).not.toContain('dfrac');
  expect(document.querySelector('ruby rt')?.textContent).toBe('かんじ');
});

it('converts fractions to speech without altering surrounding text', async () => {
  const { fractionSpeech } = await import('../../src/ui/fraction');
  expect(fractionSpeech('左の \\dfrac{1}{4} と \\frac{3}{10}')).toBe('左の 4分の1 と 10分の3');
});
