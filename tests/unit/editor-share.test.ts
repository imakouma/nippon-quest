import { describe, expect, it } from 'vitest';
import { decodeQuestionFromHash, encodeQuestionToHash } from '../../src/tools/urlShare';
import { generateRandomUser, generateRoomId } from '../../src/tools/collaboration';
import type { QuestionBase } from '../../src/questions/contracts';

describe('Web Editor URL Sharing & Collaboration', () => {
  it('correctly encodes and decodes question object to/from hash string', () => {
    const original: QuestionBase = {
      id: 'sansu.g1.tashizan.test',
      type: 'choice',
      subject: 'sansu',
      grade: 1,
      unit: 'sansu.g1.tashizan',
      timeLimitSec: 25,
      explanation: 'テスト解説',
      tags: ['テスト'],
      payload: { text: '1 + 1 = ?', choices: ['1', '2', '3'], correctIndex: 1 },
    };

    const encoded = encodeQuestionToHash(original);
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');

    const decoded = decodeQuestionFromHash(encoded) as QuestionBase;
    expect(decoded).toEqual(original);
  });

  it('handles invalid encoded string gracefully', () => {
    const decoded = decodeQuestionFromHash('invalid-base64-string!!!');
    expect(decoded).toBeNull();
  });

  it('generates valid room IDs', () => {
    const roomId = generateRoomId();
    expect(roomId).toMatch(/^nq-[a-z0-9]{6}$/);
  });

  it('generates random user avatar profile', () => {
    const user = generateRandomUser();
    expect(user.name).toBeTruthy();
    expect(user.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
