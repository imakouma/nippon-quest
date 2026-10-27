/**
 * Zod スキーマ → JSON Schema を schemas/ に書き出す。
 * 問題作成者は VS Code の "$schema" で補完・エラー表示を受けられる。
 * 問題タイプの payload スキーマは各レンダラー（registry）から集める（docs/01 §3.3 ルール3）。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod/v3';
import { contentKinds } from '../src/core/content/schemas';
import { characterBodySizesSchema } from '../src/core/content/characterBodySizes';
import { curriculumGraphSchema } from '../src/core/learning/model';
import { questionBaseSchema } from '../src/questions/contracts';
import { allRenderers } from '../src/questions/renderers/registry';

const OUT = fileURLToPath(new URL('../schemas/', import.meta.url));
mkdirSync(`${OUT}questions`, { recursive: true });

let count = 0;
const bodySizesJson = zodToJsonSchema(characterBodySizesSchema, {
  name: 'characterBodySizes',
  $refStrategy: 'none',
});
writeFileSync(`${OUT}characterBodySizes.schema.json`, JSON.stringify(bodySizesJson, null, 2) + '\n');
count++;
for (const [kind, def] of Object.entries(contentKinds)) {
  const schema = def.array ? z.array(def.schema) : def.schema;
  const json = zodToJsonSchema(schema, {
    name: kind,
    // Event branches are recursive. Keep their generated command items as a
    // JSON Schema reference instead of degrading nested steps to `{}`.
    $refStrategy: kind === 'prefectures' ? 'root' : 'none',
  });
  writeFileSync(`${OUT}${kind}.schema.json`, JSON.stringify(json, null, 2) + '\n');
  count++;
}

const curriculumJson = zodToJsonSchema(curriculumGraphSchema, {
  name: 'curriculum-graph',
  $refStrategy: 'none',
});
writeFileSync(`${OUT}curriculum-graph.schema.json`, JSON.stringify(curriculumJson, null, 2) + '\n');
count++;

// 問題タイプごと：QuestionBase ∩ { type: <literal>, payload: <renderer.schema> } の配列
for (const r of allRenderers()) {
  const one = questionBaseSchema.extend({ type: z.literal(r.type), payload: r.schema });
  const json = zodToJsonSchema(z.array(one), { name: `question.${r.type}`, $refStrategy: 'none' });
  writeFileSync(`${OUT}questions/${r.type}.schema.json`, JSON.stringify(json, null, 2) + '\n');
  count++;
}

console.log(`schemas/: ${count} files written (renderers: ${allRenderers().length})`);
