/** 教材内容の人間レビューを、危険度の高い問題から始めるための監査レポート。 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { questionBaseSchema, type QuestionBase } from '../src/questions/contracts';
import { unitSchema } from '../src/core/content/schemas';

interface AuditFinding {
  severity: 'high' | 'medium';
  kind: 'dated-fact' | 'visual-context' | 'placeholder-unit' | 'duplicate-choice';
  id: string;
  detail: string;
}

const ROOT = resolve('.');
const CONTENT = resolve(ROOT, 'content');
// 単なる歴史用語の「平成」や算数の「割合」は更新対象ではない。
// 数値・順位・「現在の〜」など、時間経過で正解が変わり得る表現だけを拾う。
const DATE_SENSITIVE = /現在の(?:元号|人口|制度)|最新の|ランキング/;
const SOCIAL_DATE_SENSITIVE =
  /世界で人口が多い|人口(?:が|は)\s*\d|生産量(?:が|は).*第[一二三四五六七八九十\d]+位|収穫量(?:が|は).*第[一二三四五六七八九十\d]+位/;
const DATED_SOURCE_ANCHOR = /(?:19|20)\d{2}年(?:版|推計|時点|調査)/;
// 「地図記号」「写真をとる」のように単語を説明するだけの問題は除き、
// 実際に画面上の図表を見ることを要求する指示語へ限定する。
const VISUAL_CONTEXT =
  /(?:次|下|上|以下)の(?:図|表|地図|グラフ|写真)|図のよう|表のとおり|写真を見て|グラフを見て|図も参考に/;

async function main(): Promise<void> {
  const manifest = JSON.parse(await readFile(resolve(CONTENT, 'manifest.json'), 'utf8')) as {
    questions: string[];
  };
  const units = unitSchema.array().parse(JSON.parse(await readFile(resolve(CONTENT, 'units.json'), 'utf8')));
  const findings: AuditFinding[] = [];
  let questionCount = 0;

  for (const unit of units) {
    if (/\d年 単元 [a-z]+[_-]\d/i.test(unit.name))
      findings.push({
        severity: 'high',
        kind: 'placeholder-unit',
        id: unit.id,
        detail: `表示名が機械生成のままです: ${unit.name}`,
      });
  }

  for (const file of manifest.questions) {
    if (file.startsWith('questions/_samples/')) continue;
    const rows = JSON.parse(await readFile(resolve(CONTENT, file), 'utf8')) as unknown[];
    for (const raw of rows) {
      const question = questionBaseSchema.parse(raw) as QuestionBase;
      questionCount += 1;
      const payload = question.payload as Record<string, unknown>;
      const prompt = String(payload.prompt ?? '');
      const explanation = question.explanation ?? '';
      const searchable = `${prompt}\n${explanation}`;
      if (
        DATE_SENSITIVE.test(searchable) ||
        (question.subject === 'shakai' &&
          SOCIAL_DATE_SENSITIVE.test(searchable) &&
          !DATED_SOURCE_ANCHOR.test(searchable))
      )
        findings.push({
          severity: 'high',
          kind: 'dated-fact',
          id: question.id,
          detail: prompt.slice(0, 160),
        });
      if (
        VISUAL_CONTEXT.test(prompt) &&
        !payload.promptImage &&
        question.type !== 'map-tap' &&
        question.type !== 'text-input'
      )
        findings.push({
          severity: 'medium',
          kind: 'visual-context',
          id: question.id,
          detail: prompt.slice(0, 160),
        });
      if (question.type === 'choice' && Array.isArray(payload.choices)) {
        const texts = payload.choices.map((choice) =>
          String((choice as { text?: unknown }).text ?? '').normalize('NFKC'),
        );
        if (new Set(texts).size !== texts.length)
          findings.push({
            severity: 'high',
            kind: 'duplicate-choice',
            id: question.id,
            detail: `同一表示の選択肢があります: ${texts.join(' / ')}`,
          });
      }
    }
  }

  findings.sort(
    (a, b) =>
      a.severity.localeCompare(b.severity) || a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id),
  );
  const report = {
    questionCount,
    unitCount: units.length,
    summary: Object.fromEntries(
      ['dated-fact', 'visual-context', 'placeholder-unit', 'duplicate-choice'].map((kind) => [
        kind,
        findings.filter((finding) => finding.kind === kind).length,
      ]),
    ),
    findings,
  };
  await mkdir(resolve(ROOT, 'imports'), { recursive: true });
  await writeFile(resolve(ROOT, 'imports/curriculum-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `curriculum: ${questionCount} questions / ${units.length} units / ${findings.length} review findings`,
  );
  if (process.argv.includes('--strict') && findings.length > 0) {
    throw new Error(`教材監査で ${findings.length} 件の要確認項目が見つかりました`);
  }
}

await main();
