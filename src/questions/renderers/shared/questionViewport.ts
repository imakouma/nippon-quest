import type { QuestionRenderer } from '../../contracts';

const DESIGN_WIDTH = 960;
const DESIGN_HEIGHT = 540;

export function questionScale(width: number, height: number, contentHeight: number): number {
  return Math.max(0, Math.min(width / DESIGN_WIDTH, height / Math.max(DESIGN_HEIGHT, contentHeight)));
}

export function fitQuestionViewport(viewport: HTMLElement, canvas: HTMLElement): void {
  const height = Math.max(DESIGN_HEIGHT, canvas.scrollHeight);
  const scale = questionScale(viewport.clientWidth, viewport.clientHeight, height);
  canvas.style.transform = `scale(${scale})`;
  canvas.style.left = `${Math.max(0, (viewport.clientWidth - DESIGN_WIDTH * scale) / 2)}px`;
  canvas.style.top = `${Math.max(0, (viewport.clientHeight - height * scale) / 2)}px`;
  viewport.dataset.scale = String(scale);
  viewport.dataset.contentHeight = String(height);
}

/** Every registered renderer uses the same coordinates in the game, preview and audit. */
export function withQuestionViewport(renderer: QuestionRenderer): QuestionRenderer {
  return {
    ...renderer,
    async mount(ctx) {
      const viewport = document.createElement('div');
      viewport.className = 'nq-question-viewport';
      const canvas = document.createElement('div');
      canvas.className = 'nq-question-canvas';
      viewport.append(canvas);
      ctx.container.append(viewport);
      const fit = () => fitQuestionViewport(viewport, canvas);
      const observer = new ResizeObserver(fit);
      observer.observe(viewport);
      observer.observe(canvas);
      try {
        const result = renderer.mount({ ...ctx, container: canvas });
        fit();
        return await result;
      } finally {
        observer.disconnect();
        viewport.remove();
      }
    },
  };
}
