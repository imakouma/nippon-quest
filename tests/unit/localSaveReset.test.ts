import { describe, expect, it } from 'vitest';
import { isLocalDevelopmentUrl, shouldResetLocalSaves } from '../../src/core/localDevelopment';

const reset = (href: string, dev = false) => shouldResetLocalSaves(new URL(href), dev);

describe('確認用セーブ初期化URL', () => {
  it('localhost の本番previewもローカル開発環境として扱う', () => {
    expect(isLocalDevelopmentUrl(new URL('http://127.0.0.1:5173/'), false)).toBe(true);
    expect(isLocalDevelopmentUrl(new URL('https://nihonquest.example/'), false)).toBe(false);
  });

  it('ローカルの開発・プレビューでは resetSaves で初期化する', () => {
    expect(reset('http://127.0.0.1:5173/?resetSaves=1')).toBe(true);
    expect(reset('http://localhost:4174/?resetSaves=1')).toBe(true);
    expect(reset('http://[::1]:5173/?resetSaves=1')).toBe(true);
  });

  it('クエリがなければローカルでも初期化しない', () => {
    expect(reset('http://127.0.0.1:5173/')).toBe(false);
  });

  it('本番サイトでは resetSaves を付けても初期化しない', () => {
    expect(reset('https://nihonquest.example/?resetSaves=1')).toBe(false);
  });

  it('Vite開発時は任意ホストの確認環境でも初期化できる', () => {
    expect(reset('https://dev.example/?resetSaves=1', true)).toBe(true);
  });
});
