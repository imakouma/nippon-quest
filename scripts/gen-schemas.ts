/**
 * Zod スキーマ → JSON Schema を schemas/ に書き出す。
 * 問題作成者は VS Code の "$schema" で補完・エラー表示を受けられる。
 * 問題タイプの payload スキーマは各レンダラー（registry）から集める（docs/01 §3.3 ルール3）。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { contentKinds } from '../src/core/content/schemas';
import { questionBaseSchema } from '../src/questions/contracts';
import { allRenderers } from '../src/questions/renderers/registry';

const OUT = new URL('../schemas/', import.meta.url).pathname;
mkdirSync(`${OUT}questions`, { recursive: true });

let count = 0;
for (const [kind, def] of Object.entries(contentKinds)) {
  const schema = def.array ? z.array(def.schema) : def.schema;
  const json = zodToJsonSchema(schema, { name: kind, $refStrategy: 'none' });
  writeFileSync(`${OUT}${kind}.schema.json`, JSON.stringify(json, null, 2) + '\n');
  count++;
}

// 問題タイプごと：QuestionBase ∩ { type: <literal>, payload: <renderer.schema> } の配列
for (const r of allRenderers()) {
  const one = questionBaseSchema.extend({ type: z.literal(r.type), payload: r.schema });
  const json = zodToJsonSchema(z.array(one), { name: `question.${r.type}`, $refStrategy: 'none' });
  writeFileSync(`${OUT}questions/${r.type}.schema.json`, JSON.stringify(json, null, 2) + '\n');
  count++;
}

console.log(`schemas/: ${count} files written (renderers: ${allRenderers().length})`);
