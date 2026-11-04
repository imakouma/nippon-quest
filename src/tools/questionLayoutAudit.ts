/** Layout checks are deliberately stricter than "reachable by scrolling". */
export function inspectQuestion(host: HTMLElement): string[] {
  const viewport = host.querySelector<HTMLElement>('.nq-question-viewport');
  const question = host.querySelector<HTMLElement>('.nq-q');
  if (!viewport || !question) return ['問題のルートが描画されていません'];
  const bounds = viewport.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0 || question.getBoundingClientRect().width <= 0)
    return ['問題枠の表示サイズが0です'];
  const errors = new Set<string>();
  const inside = (r: DOMRect) =>
    r.left >= bounds.left - 1 &&
    r.right <= bounds.right + 1 &&
    r.top >= bounds.top - 1 &&
    r.bottom <= bounds.bottom + 1;
  const visible = (element: Element) => {
    if (element.closest('.nq-visually-hidden')) return false;
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  };
  for (const element of question.querySelectorAll<HTMLElement>('*')) {
    if (!visible(element)) continue;
    const name = element.classList[0] || element.tagName.toLowerCase();
    if (!inside(element.getBoundingClientRect())) errors.add(`${name} が問題枠からはみ出しています`);
    if (element instanceof HTMLImageElement && (!element.complete || element.naturalWidth === 0))
      errors.add(`${name} の画像を読み込めません`);
    const style = getComputedStyle(element);
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
      if (style.overflowX !== 'visible' && element.scrollWidth > element.clientWidth + 2)
        errors.add(`${name} の内容が横に隠れています`);
      if (style.overflowY !== 'visible' && element.scrollHeight > element.clientHeight + 2)
        errors.add(`${name} の内容が縦に隠れています`);
    }
  }
  const walker = document.createTreeWalker(question, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent?.trim() || !node.parentElement || !visible(node.parentElement)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    if ([...range.getClientRects()].some((r) => !inside(r)))
      errors.add('問題文・選択肢の文字が問題枠からはみ出しています');
  }
  return [...errors];
}
