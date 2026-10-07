/**
 * 三分割の境界（docs/01 §3.3）を「テストで」守る。
 * ESLint でも弾いているが、AI が設定ごと書き換えることがあるので、テストでも二重に守る。
 * このテストが落ちたら、設計が崩れたということ。安易に緩めないこと。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

function files(dir: string, exts = ['.ts', '.tsx']): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (exts.some((e) => n.endsWith(e))) out.push(p);
    }
  };
  walk(dir);
  return out;
}

const readAll = (dir: string) =>
  files(join(ROOT, dir)).map((f) => ({ file: f.replace(ROOT, ''), src: readFileSync(f, 'utf8') }));

describe('境界1: content/ にコードを置かない', () => {
  it('content/ は JSON だけ', () => {
    const bad = files(join(ROOT, 'content'), ['.ts', '.tsx', '.js', '.mjs', '.cjs']);
    expect(bad).toEqual([]);
  });
});

describe('境界2: レンダラーは Phaser も GameState も知らない', () => {
  const sources = readAll('src/questions/renderers');
  it('Phaser を import しない', () => {
    const bad = sources.filter((s) => /from\s+['"]phaser/.test(s.src)).map((s) => s.file);
    expect(bad).toEqual([]);
  });
  it('core / scenes を import しない', () => {
    const bad = sources
      .filter((s) => /from\s+['"][^'"]*(\/core\/|\/scenes\/)/.test(s.src))
      .map((s) => s.file);
    expect(bad).toEqual([]);
  });
  it('localStorage / IndexedDB に直接触らない（セーブはゲーム本体の責務）', () => {
    const bad = sources.filter((s) => /localStorage|indexedDB|localforage/.test(s.src)).map((s) => s.file);
    expect(bad).toEqual([]);
  });
});

describe('境界3: ゲーム本体は問題タイプを知らない', () => {
  const sources = [...readAll('src/core'), ...readAll('src/scenes')];
  const TYPES = [
    'choice',
    'picture-word',
    'number-build',
    'sort-order',
    'map-tap',
    'experiment',
    'kanji-trace',
    'pair-match',
  ];

  it('問題タイプ名で分岐しない', () => {
    const bad: string[] = [];
    for (const s of sources)
      for (const t of TYPES) if (new RegExp(`['"\`]${t}['"\`]`).test(s.src)) bad.push(`${s.file}: "${t}"`);
    expect(bad).toEqual([]);
  });

  it('renderers を import しない', () => {
    const bad = sources.filter((s) => /from\s+['"][^'"]*renderers/.test(s.src)).map((s) => s.file);
    expect(bad).toEqual([]);
  });

  it('src/core は Phaser / Preact を import しない（純粋ロジック）', () => {
    const bad = readAll('src/core')
      .filter((s) => /from\s+['"](phaser|preact)/.test(s.src))
      .map((s) => s.file);
    expect(bad).toEqual([]);
  });
});

describe('境界4: 乱数はシード付きのみ', () => {
  it('Math.random を使っていない', () => {
    const bad = readAll('src')
      .filter((s) => !/(^|[\\/])src[\\/]core[\\/]rng\.ts$/.test(s.file) && /Math\.random/.test(s.src))
      .map((s) => s.file);
    expect(bad).toEqual([]);
  });
});

describe('境界5: contracts.ts は独立している', () => {
  it('contracts.ts は zod 以外を import しない', () => {
    const src = readFileSync(join(ROOT, 'src/questions/contracts.ts'), 'utf8');
    const imports = [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);
    expect(imports.filter((i) => i !== 'zod')).toEqual([]);
  });
});
