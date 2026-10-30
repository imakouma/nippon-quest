import { createHash } from 'node:crypto';
import type { QuestionBase } from '../contracts';

export const KOKUGO_REVIEW_HEADERS = [
  '管理ID',
  '学年',
  '単元',
  '問題形式',
  '原文（問題文）',
  '原文（選択肢）',
  '正解',
  '原文（解説）',
  '自動チェック（警告のみ）',
  '確認状態',
  '修正後（問題文）',
  '修正後（選択肢）',
  '修正後（解説）',
  'ゼミ生メモ',
  '確認者',
  '確認日',
  '元ファイル',
  '元データ位置',
  '原文ハッシュ',
] as const;

export type KokugoReviewHeader = (typeof KOKUGO_REVIEW_HEADERS)[number];
export type KokugoReviewRow = Record<KokugoReviewHeader, string>;

type Choice = { id: string; text?: string; image?: string };
type Card = { id: string; text: string };
type ReviewPayload = {
  prompt?: string;
  hintWord?: string;
  choices?: Choice[] | string[];
  cards?: Card[];
  answer?: string | string[];
  reading?: string;
};

function payload(question: QuestionBase): ReviewPayload {
  return question.payload as ReviewPayload;
}

export function reviewPrompt(question: QuestionBase): string {
  const value = payload(question);
  return value.prompt ?? value.hintWord ?? '';
}

export function reviewChoices(question: QuestionBase): string {
  const value = payload(question);
  if (Array.isArray(value.choices)) {
    return value.choices
      .map((choice, index) =>
        typeof choice === 'string'
          ? `${index + 1}: ${choice}`
          : `${choice.id}: ${choice.text ?? (choice.image ? '[画像]' : '')}`,
      )
      .join('\n');
  }
  return (value.cards ?? []).map((card) => `${card.id}: ${card.text}`).join('\n');
}

export function reviewAnswer(question: QuestionBase): string {
  const value = payload(question);
  const answer = Array.isArray(value.answer)
    ? value.answer.join(' → ')
    : (value.answer ?? value.reading ?? '');
  if (!answer || !Array.isArray(value.choices) || typeof value.choices[0] === 'string') return answer;
  const choice = (value.choices as Choice[]).find((item) => item.id === answer);
  return choice?.text ? `${answer}: ${choice.text}` : answer;
}

function visibleLength(text: string): number {
  return [...text.replace(/\[([^\]]+)]/g, '')].length;
}

function cumulativeKanji(grade: number, byGrade: Record<string, string>): Set<string> {
  const result = new Set<string>();
  for (let current = 1; current <= grade; current += 1) {
    for (const char of byGrade[String(current)] ?? '') result.add(char);
  }
  return result;
}

export function reviewWarnings(question: QuestionBase, byGrade: Record<string, string>): string[] {
  const prompt = reviewPrompt(question);
  const choices = reviewChoices(question);
  const explanation = question.explanation ?? '';
  const warnings: string[] = [];
  if (!prompt && question.type !== 'kanji-trace') warnings.push('問題文が空です');
  if (visibleLength(prompt) > 70) warnings.push('問題文が70文字を超えます');
  const choiceLines = choices.split('\n').filter(Boolean);
  if (choiceLines.some((line) => visibleLength(line.replace(/^[^:：]+[:：]\s*/, '')) > 35)) {
    warnings.push('選択肢に35文字を超える文があります');
  }
  const normalized = choiceLines.map((line) => line.replace(/^[^:：]+[:：]\s*/, '').trim());
  if (new Set(normalized).size !== normalized.length) warnings.push('同じ選択肢があります');
  if (!explanation) warnings.push('解説がありません');

  const allowed = cumulativeKanji(question.grade, byGrade);
  const textWithoutRuby = [prompt, choices, explanation]
    .join('\n')
    .replace(/[\p{Script=Han}々〆ヶ]+\[[^\]]+\]/gu, '');
  const advancedKanji = [
    ...new Set([...textWithoutRuby].filter((char) => /[\p{Script=Han}]/u.test(char) && !allowed.has(char))),
  ];
  if (advancedKanji.length) {
    warnings.push(`配当学年より上の漢字（ルビなし）: ${advancedKanji.join('')}`);
  }
  return warnings;
}

export function reviewFingerprint(question: QuestionBase): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        id: question.id,
        type: question.type,
        subject: question.subject,
        grade: question.grade,
        unit: question.unit,
        tags: question.tags,
        timeLimitSec: question.timeLimitSec,
        payload: question.payload,
        explanation: question.explanation ?? '',
      }),
    )
    .digest('hex');
}

export function makeKokugoReviewRow(
  question: QuestionBase,
  sourceFile: string,
  sourceIndex: number,
  byGrade: Record<string, string>,
): KokugoReviewRow {
  return {
    管理ID: question.id,
    学年: String(question.grade),
    単元: question.unit,
    問題形式: question.type,
    '原文（問題文）': reviewPrompt(question),
    '原文（選択肢）': reviewChoices(question),
    正解: reviewAnswer(question),
    '原文（解説）': question.explanation ?? '',
    '自動チェック（警告のみ）': reviewWarnings(question, byGrade).join('\n'),
    確認状態: '未確認',
    '修正後（問題文）': '',
    '修正後（選択肢）': '',
    '修正後（解説）': '',
    ゼミ生メモ: '',
    確認者: '',
    確認日: '',
    元ファイル: sourceFile,
    元データ位置: String(sourceIndex + 1),
    原文ハッシュ: reviewFingerprint(question),
  };
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toReviewCsv(rows: KokugoReviewRow[]): string {
  const lines = [
    KOKUGO_REVIEW_HEADERS.map(csvCell).join(','),
    ...rows.map((row) => KOKUGO_REVIEW_HEADERS.map((header) => csvCell(row[header])).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function parseReviewCsv(text: string): KokugoReviewRow[] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value !== '')) records.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    records.push(row);
  }
  const headers = (records.shift() ?? []).map((value) => value.replace(/^\uFEFF/, ''));
  if (headers.join('\0') !== KOKUGO_REVIEW_HEADERS.join('\0')) {
    throw new Error('確認表の列名または列順が変更されています');
  }
  return records.map((values) =>
    Object.fromEntries(KOKUGO_REVIEW_HEADERS.map((header, index) => [header, values[index] ?? ''])),
  ) as KokugoReviewRow[];
}

function parseLabeledLines(text: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const line of text.split(/\r?\n/).filter((value) => value.trim())) {
    const match = /^([^:：]+)[:：]\s*(.*)$/.exec(line);
    if (!match) throw new Error(`選択肢は「id: 文章」の形で入力してください: ${line}`);
    result.set(match[1]!.trim(), match[2] ?? '');
  }
  return result;
}

export function applyKokugoReviewRow(question: QuestionBase, row: KokugoReviewRow): boolean {
  if (row['原文ハッシュ'] !== reviewFingerprint(question)) {
    throw new Error(`${question.id}: 確認表を作った後に元データが変わっています`);
  }
  const nextPrompt = row['修正後（問題文）'].trim();
  const nextChoices = row['修正後（選択肢）'].trim();
  const nextExplanation = row['修正後（解説）'].trim();
  if (!nextPrompt && !nextChoices && !nextExplanation) {
    throw new Error(`${question.id}: 「反映可」ですが修正後の文章が空です`);
  }
  const value = payload(question);
  if (nextPrompt) {
    if (typeof value.prompt === 'string') value.prompt = nextPrompt;
    else if (typeof value.hintWord === 'string') value.hintWord = nextPrompt;
    else throw new Error(`${question.id}: 問題文を反映できない問題形式です`);
  }
  if (nextChoices) {
    const replacements = parseLabeledLines(nextChoices);
    if (Array.isArray(value.choices) && typeof value.choices[0] !== 'string') {
      const choices = value.choices as Choice[];
      const ids = new Set(choices.map((choice) => choice.id));
      if (replacements.size !== ids.size || [...replacements.keys()].some((id) => !ids.has(id))) {
        throw new Error(`${question.id}: 選択肢IDの追加・削除・変更はできません`);
      }
      for (const choice of choices) {
        const replacement = replacements.get(choice.id)!;
        if (replacement === '[画像]' && choice.image) delete choice.text;
        else choice.text = replacement;
      }
    } else if (Array.isArray(value.cards)) {
      const ids = new Set(value.cards.map((card) => card.id));
      if (replacements.size !== ids.size || [...replacements.keys()].some((id) => !ids.has(id))) {
        throw new Error(`${question.id}: カードIDの追加・削除・変更はできません`);
      }
      for (const card of value.cards) card.text = replacements.get(card.id)!;
    } else if (Array.isArray(value.choices)) {
      if (replacements.size !== value.choices.length) {
        throw new Error(`${question.id}: 選択肢の数は変更できません`);
      }
      value.choices = [...replacements.values()];
    } else throw new Error(`${question.id}: 選択肢を反映できない問題形式です`);
  }
  if (nextExplanation) question.explanation = nextExplanation;
  return true;
}
