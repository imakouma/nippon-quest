import { Fragment } from 'preact';

const FRACTION = /\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}/g;

export function fractionSpeech(text: string): string {
  return text.replace(
    FRACTION,
    (_match, numerator: string, denominator: string) => `${denominator}分の${numerator}`,
  );
}

export function renderFractions(text: string) {
  return text.split(FRACTION).map((part, index, parts) => {
    if (index % 3 === 1) {
      const denominator = parts[index + 1];
      return (
        <span class="nq-fraction" role="math" aria-label={`${denominator}分の${part}`} key={index}>
          <span aria-hidden="true">{part}</span>
          <span aria-hidden="true">{denominator}</span>
        </span>
      );
    }
    return index % 3 === 0 ? <Fragment key={index}>{part}</Fragment> : null;
  });
}
