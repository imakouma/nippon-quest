// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * プロジェクトの境界ルールを Lint で機械的に守らせる。
 *  - Math.random 禁止（src/core/rng.ts のシード付き乱数を使う）
 *  - src/questions/renderers/** から phaser / core を import 禁止
 *  - src/core/** から DOM・phaser・renderers を import 禁止（純粋ロジック）
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.vite/**',
      'raw/**',
      'schemas/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Math.random は禁止。src/core/rng.ts の createRng() を使うこと。',
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // rng.ts 自身だけは seedrandom を包むために Math.random を参照してよい（実際には使わない）
    files: ['src/core/rng.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['src/questions/renderers/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['phaser', 'phaser/*'],
              message: 'レンダラーは Phaser を知ってはいけない（docs/01 §3.3）。',
            },
            {
              group: ['@/core/*', '**/core/*', '@/scenes/*', '**/scenes/*'],
              message: 'レンダラーは GameState / Scene に触れない。契約は contracts.ts のみ。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['phaser', 'phaser/*'], message: 'src/core は Phaser 非依存（純粋ロジック）。' },
            {
              group: ['@/questions/renderers/*', '**/renderers/*'],
              message: 'ゲーム本体は問題タイプを知らない。QuestionResult.score だけを使う。',
            },
            { group: ['preact', 'preact/*'], message: 'src/core は UI 非依存。' },
          ],
        },
      ],
    },
  },
  prettier,
);
