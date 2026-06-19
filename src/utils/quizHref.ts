/** クイズ画面へのリンク（Next.js 16 の動的 params 問題を避けるためクエリ形式） */
export function getQuizHref(unitId: string): string {
  return `/quiz?unitId=${encodeURIComponent(unitId)}`;
}
