/** Exact-fingerprint allowlist gate for promoting reviewed legacy questions into content/. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { questionBaseSchema, type QuestionBase } from '../src/questions/contracts';
import { choicePayloadSchema } from '../src/questions/renderers/choice/schema';
import type { StagedLegacyQuestion } from './import-legacy-questions';

export interface PromotionEntry {
  fingerprint: string;
  id: string;
  expectedAnswer: string;
}

export interface PromotionManifest {
  source: 'autonomy-game';
  reviewedAt: string;
  reviewer: string;
  provenanceConfirmed: boolean;
  unit: string;
  output: string;
  entries: PromotionEntry[];
}

export function promoteReviewedQuestions(
  staged: StagedLegacyQuestion[],
  manifest: PromotionManifest,
): QuestionBase[] {
  if (!manifest.provenanceConfirmed) throw new Error('出典・利用条件の確認が完了していません');
  if (!manifest.reviewer.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(manifest.reviewedAt))
    throw new Error('reviewer と reviewedAt が必要です');

  const byFingerprint = new Map(staged.map((question) => [question.legacy.fingerprint, question]));
  const seen = new Set<string>();
  return manifest.entries.map((entry) => {
    if (seen.has(entry.fingerprint)) throw new Error(`fingerprint が重複: ${entry.fingerprint}`);
    seen.add(entry.fingerprint);
    const source = byFingerprint.get(entry.fingerprint);
    if (!source) throw new Error(`ステージングに存在しない fingerprint: ${entry.fingerprint}`);
    if (source.legacy.reviewFlags.length)
      throw new Error(`${entry.fingerprint} は要視覚レビュー: ${source.legacy.reviewFlags.join(', ')}`);
    const payload = choicePayloadSchema.parse(source.payload);
    const actualAnswer = payload.choices.find((choice) => choice.id === payload.answer)?.text;
    if (actualAnswer !== entry.expectedAnswer)
      throw new Error(`${entry.fingerprint} の正解がレビュー記録と不一致`);
    const promoted: QuestionBase = {
      ...source,
      id: entry.id,
      unit: manifest.unit,
      tags: [
        'source:legacy-autonomy-game',
        `legacy-node:${source.legacy.nodeId}`,
        `reviewed:${manifest.reviewedAt}`,
      ],
    };
    delete (promoted as QuestionBase & { legacy?: unknown }).legacy;
    questionBaseSchema.parse(promoted);
    choicePayloadSchema.parse(promoted.payload);
    return promoted;
  });
}

async function main(): Promise<void> {
  const manifestArg = process.argv.slice(2).find((arg) => arg !== '--');
  if (!manifestArg) throw new Error('manifest JSON を指定してください');
  const manifestPath = resolve(manifestArg);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as PromotionManifest;
  const staged = JSON.parse(
    await readFile(resolve('imports/legacy-questions/staged.json'), 'utf8'),
  ) as StagedLegacyQuestion[];
  if (!manifest.output.startsWith('content/questions/'))
    throw new Error('output は content/questions/ 配下に限定されます');
  const questions = promoteReviewedQuestions(staged, manifest);
  await writeFile(resolve(manifest.output), `${JSON.stringify(questions, null, 2)}\n`, { flag: 'wx' });
  console.log(`${questions.length} questions promoted to ${manifest.output}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
