/**
 * 問題タイプ → レンダラーの登録表。
 * 新しいタイプを足すときは、renderers/<type>/index.ts を作って下の1行を追加するだけ（docs/01 §3.3 手順5）。
 */
import type { QuestionRenderer } from '../contracts';
import { choiceRenderer } from './choice';
import { pictureWordRenderer } from './picture-word';

const registry = new Map<string, QuestionRenderer>();

export function registerRenderer(r: QuestionRenderer): void {
  if (registry.has(r.type)) throw new Error(`renderer "${r.type}" は既に登録されています`);
  registry.set(r.type, r);
}

export function getRenderer(type: string): QuestionRenderer | undefined {
  return registry.get(type);
}

export function requireRenderer(type: string): QuestionRenderer {
  const r = registry.get(type);
  if (!r) throw new Error(`未登録の問題タイプ "${type}"。renderers/registry.ts に登録してください`);
  return r;
}

export function allRenderers(): QuestionRenderer[] {
  return [...registry.values()];
}

// ── 登録（1タイプ1行） ──
registerRenderer(choiceRenderer);
registerRenderer(pictureWordRenderer);
// registerRenderer(numberBuildRenderer);
// registerRenderer(sortOrderRenderer);
// registerRenderer(mapTapRenderer);
// registerRenderer(experimentRenderer);
// registerRenderer(kanjiTraceRenderer);
// registerRenderer(pairMatchRenderer);
