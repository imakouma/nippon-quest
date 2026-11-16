/** 地図・道具・しくみを描き、正答キーと選択肢は保つ。 */
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { ink, xml, type Draw } from './shakai-visuals/drawing';
import { grade3 } from './shakai-visuals/grade3';
import { grade4 } from './shakai-visuals/grade4';
import { grade5 } from './shakai-visuals/grade5';
import { grade6 } from './shakai-visuals/grade6';
import { repairedVisuals } from './shakai-visuals/repairs';
interface Question {
  id: string;
  type: string;
  grade: number;
  unit: string;
  explanation?: string;
  payload: {
    prompt?: string;
    template?: string;
    image?: string;
    promptImage?: string;
    promptImageAlt?: string;
    promptSpeech?: string;
    answer?: string;
    answers?: string[];
    choices?: { id: string; text?: string }[];
  };
}
const sets = readdirSync('content/questions/shakai', { recursive: true })
  .filter((f) => String(f).endsWith('.json'))
  .sort()
  .map((file) => ({
    file: `content/questions/shakai/${file}`,
    questions: JSON.parse(readFileSync(`content/questions/shakai/${file}`, 'utf8')) as Question[],
  }));
const all = sets.flatMap((s) => s.questions);
assert.equal(all.length, 469);
const signature = () =>
  JSON.stringify(
    all.map((q) => [q.id, q.type, q.grade, q.unit, q.payload.answer, q.payload.answers, q.payload.choices]),
  );

const repairs = JSON.parse(readFileSync('scripts/data/shakai-source-repairs.json', 'utf8')) as {
  hash: string;
  prompt?: string;
  template?: string;
  explanation?: string;
  choiceText?: { id: string; text: string };
  choiceTexts?: { id: string; text: string }[];
  sourceChoices?: { id: string; text: string }[];
}[];
for (const repair of repairs) {
  const matches = all.filter((q) => q.id.endsWith(repair.hash));
  assert.equal(matches.length, 1, repair.hash);
  const q = matches[0]!;
  const p = q.payload;
  if (repair.explanation) q.explanation = repair.explanation;
  if (repair.choiceText) {
    const choice = p.choices?.find((c) => c.id === repair.choiceText!.id);
    assert(choice, repair.hash);
    assert(choice.text === '炭火[すみび]アイロン（火のし）' || choice.text === repair.choiceText.text);
    choice.text = repair.choiceText.text;
  }
  if (repair.choiceTexts) {
    assert.deepEqual(
      p.choices?.map((c) => c.id),
      repair.choiceTexts.map((c) => c.id),
    );
    assert(
      JSON.stringify(p.choices) === JSON.stringify(repair.sourceChoices) ||
        JSON.stringify(p.choices) === JSON.stringify(repair.choiceTexts),
    );
    p.choices = repair.choiceTexts;
  }
  if (repair.prompt) p.prompt = repair.prompt;
  if (repair.template) {
    assert.equal(repair.template.match(/\{\{INPUT\}\}/g)?.length, p.answers?.length, repair.hash);
    p.template = repair.template;
  }
}
const before = signature();
const fukuoka = all.find((q) => q.id.endsWith('e2f89bc12f06'))!;
const fp = fukuoka.payload as unknown as {
  hotspots: { x: number; y: number; label: string }[];
  radius: number;
};
fp.radius = 20;
for (const h of fp.hotspots) {
  const centers: Record<string, [number, number]> = {
    中央: [70.8333, 34.6154],
    博多: [70.8333, 76.9231],
    東: [29.1667, 76.9231],
    西: [29.1667, 34.6154],
  };
  [h.x, h.y] = centers[h.label]!;
}
const dir = 'assets/questions/shakai/visuals';
mkdirSync(dir, { recursive: true });
const changed = new Map<string, string>();
const replacements = JSON.parse(
  readFileSync('scripts/data/shakai-image-replacements.json', 'utf8'),
) as string[];
const draw: Draw = (name, hashes, description, body, height = 260) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="${height}" viewBox="0 0 480 ${height}" role="img" aria-label="${xml(description)}"><title>${xml(description)}</title><rect width="480" height="${height}" rx="12" fill="#fff"/><g fill="${ink}" font-family="sans-serif">${body}</g></svg>\n`;
  assert(!svg.includes('undefined'));
  writeFileSync(`${dir}/${name}.svg`, svg);
  for (const hash of hashes) {
    const matches = all.filter((q) => q.id.endsWith(hash));
    assert.equal(matches.length, 1, hash);
    const q = matches[0]!;
    assert(!changed.has(q.id));
    assert(
      !q.payload.promptImage ||
        q.payload.promptImage.startsWith('questions/shakai/visuals/') ||
        replacements.includes(hash),
      `Existing image: ${q.id}`,
    );
    if (q.type === 'map-tap') q.payload.image = `questions/shakai/visuals/${name}.svg`;
    else q.payload.promptImage = `questions/shakai/visuals/${name}.svg`;
    if (replacements.includes(hash) && q.payload.prompt)
      q.payload.prompt = q.payload.prompt.replaceAll('写真の地図', '図').replaceAll('写真', '図');
    if (q.type === 'choice') q.payload.promptSpeech = `${q.payload.prompt} ${description}`;
    else if (q.type !== 'map-tap') q.payload.promptImageAlt = description;
    changed.set(q.id, description);
  }
};
grade3(draw);
grade4(draw);
grade5(draw);
grade6(draw);
repairedVisuals(draw);
assert.equal(signature(), before);
for (const s of sets) writeFileSync(s.file, JSON.stringify(s.questions, null, 2) + '\n');
const review = all.map((q) => ({
  id: q.id,
  decision: changed.has(q.id)
    ? 'illustrated'
    : q.payload.promptImage || q.type === 'map-tap'
      ? 'existing-visual'
      : 'text-sufficient',
  reason:
    changed.get(q.id) ??
    (q.payload.promptImage || q.type === 'map-tap'
      ? '既存の写真・地図・資料を維持し、問題文と対応する観察対象を確認する'
      : '名称・理由・選択肢の比較が学習対象。本文に判断条件があり、答えだけを示す装飾図は追加しない。'),
}));
writeFileSync('scripts/data/shakai-visual-review.json', JSON.stringify(review, null, 2) + '\n');
console.log(`${changed.size} / ${all.length} social studies questions illustrated`);
