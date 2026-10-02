import { describe, expect, it } from 'vitest';
import { decodeQuestionFromHash, encodeQuestionToHash } from '../../src/tools/urlShare';
import { generateRandomUser, generateRoomId, isCollabMessage } from '../../src/tools/collaboration';
import {
  isEditorQuestionDraft,
  SAMPLE_QUESTIONS,
  validateEditorQuestion,
} from '../../src/tools/editorSamples';
import { questionBaseSchema } from '../../src/questions/contracts';
import { requireRenderer } from '../../src/questions/renderers/registry';
import type { QuestionBase } from '../../src/questions/contracts';

describe('Web Editor URL Sharing & Collaboration', () => {
  it('エディタの全サンプルが現行の問題・payload契約を満たす', () => {
    for (const sample of SAMPLE_QUESTIONS) {
      expect(questionBaseSchema.safeParse(sample).success, sample.id).toBe(true);
      expect(requireRenderer(sample.type).schema.safeParse(sample.payload).success, sample.id).toBe(true);
    }
  });

  it('共有・同期データは基本項目とpayloadの両方を検証する', () => {
    expect(validateEditorQuestion(SAMPLE_QUESTIONS[0])).toMatchObject(SAMPLE_QUESTIONS[0]!);
    expect(validateEditorQuestion({ ...SAMPLE_QUESTIONS[0], grade: 99 })).toBeNull();
    expect(
      validateEditorQuestion({
        ...SAMPLE_QUESTIONS[0],
        payload: { prompt: '問題', choices: [{ id: 'a', text: 'A' }], answer: 'missing' },
      }),
    ).toBeNull();
  });

  it('JSONフォーム状態へ null・配列・プリミティブを入れない', () => {
    expect(isEditorQuestionDraft({ id: '編集中' })).toBe(true);
    expect(isEditorQuestionDraft(null)).toBe(false);
    expect(isEditorQuestionDraft([])).toBe(false);
    expect(isEditorQuestionDraft('文字列')).toBe(false);
  });

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

  it('壊れたタブ間同期メッセージを拒否する', () => {
    expect(isCollabMessage(null)).toBe(false);
    expect(isCollabMessage({ type: 'JOIN' })).toBe(false);
    expect(isCollabMessage({ type: 'HEARTBEAT', sender: { id: 'x' } })).toBe(false);
    expect(isCollabMessage({ type: 'FOCUS_FIELD', senderId: 'x', field: 42 })).toBe(false);
    expect(
      isCollabMessage({
        type: 'JOIN',
        sender: { id: 'x', name: 'ハル', color: '#ffffff', lastSeen: 1, focusedField: null },
      }),
    ).toBe(true);
    expect(isCollabMessage({ type: 'UPDATE_QUESTION', senderId: 'x', question: null })).toBe(true);
  });
});
