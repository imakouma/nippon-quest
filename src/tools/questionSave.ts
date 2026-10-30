import { isDeepStrictEqual } from 'node:util';
import { questionBaseSchema } from '../questions/contracts';
import { getRenderer } from '../questions/renderers/registry';

/** Validate a replacement without losing unrelated questions or unknown fields. */
export function replaceQuestionForSave(
  source: unknown,
  expected: unknown,
  questionId: string,
  replacement: unknown,
): unknown[] {
  if (!Array.isArray(source) || !Array.isArray(expected)) throw new Error('問題ファイルの形式が不正です');
  if (!isDeepStrictEqual(source, expected)) {
    throw new Error('問題ファイルが別の場所で変更されています。再読込してください');
  }
  const next = questionBaseSchema.safeParse(replacement);
  if (!next.success) throw new Error('問題データの形式が不正です');
  const matches = source.flatMap((item, index) =>
    item && typeof item === 'object' && item.id === questionId ? [index] : [],
  );
  if (matches.length !== 1) throw new Error('保存する問題が見つかりません');
  const original = questionBaseSchema.safeParse(source[matches[0]!]);
  if (!original.success) throw new Error('問題データの形式が不正です');
  const before = original.data;
  const after = next.data;
  if (before.id !== after.id || before.unit !== after.unit || before.type !== after.type) {
    throw new Error('問題 ID、単元、問題タイプは変更できません');
  }
  if (!after.unit.startsWith(`${after.subject}.g${after.grade}.`)) {
    throw new Error('教科・学年と単元が一致しません');
  }
  const renderer = getRenderer(after.type);
  if (!renderer || !renderer.schema.safeParse(after.payload).success) {
    throw new Error('問題の内容が不正です');
  }
  return source.map((item, index) => (index === matches[0] ? replacement : item));
}
