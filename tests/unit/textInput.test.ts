import { describe, expect, it } from 'vitest';
import { normalizeInput, textInputScore } from '../../src/questions/renderers/text-input/schema';
describe('text-input', () => {
  it('全角数字・空白・桁区切りを正規化する', () => expect(normalizeInput(' ４２,１９５ ')).toBe('42195'));
  it('複数欄を部分点つきで採点する', () =>
    expect(textInputScore({ prompt: 'p', answers: ['4', '2'] }, ['4', '3'])).toBe(0.5));
});
