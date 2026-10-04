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
const DATE_SENSITIVE = /現在|最新|ランキング|令和|平成|20\d{2}年/;
const SOCIAL_DATE_SENSITIVE = /人口|生産量|収穫量|割合|第[一二三四五六七八九十\d]+位/;
const VISUAL_CONTEXT = /次の図|下の図|表のとおり|グラフ|地図|写真|画像/;

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
        (question.subject === 'shakai' && SOCIAL_DATE_SENSITIVE.test(searchable))
      )
        findings.push({
          severity: 'high',
          kind: 'dated-fact',
          id: question.id,
          detail: prompt.slice(0, 160),
        });
      if (VISUAL_CONTEXT.test(prompt) && !payload.promptImage && question.type !== 'map-tap')
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
    generatedAt: new Date().toISOString(),
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
}

await main();
