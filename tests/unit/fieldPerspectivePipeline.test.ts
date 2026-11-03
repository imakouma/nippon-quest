import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    WEBGL: 2,
    Renderer: {
      WebGL: {
        Pipelines: { PostFXPipeline: class {} },
      },
    },
    Cameras: { Scene2D: { Events: { DESTROY: 'cameradestroy' } } },
  },
}));

import { attachFieldPerspective } from '../../src/scenes/overworld/fieldPerspectivePipeline';

const addPostPipeline = vi.fn();
const setPostPipeline = vi.fn();
const resetPostPipeline = vi.fn();
const once = vi.fn();

function scene(rendererType: number) {
  return {
    game: { renderer: { type: rendererType, pipelines: { addPostPipeline } } },
    cameras: { main: { setPostPipeline, resetPostPipeline, once } },
  };
}

describe('attachFieldPerspective', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers and attaches one world-camera pipeline in WebGL', () => {
    expect(attachFieldPerspective(scene(2) as never)).toBe(true);
    expect(addPostPipeline).toHaveBeenCalledOnce();
    expect(setPostPipeline).toHaveBeenCalledWith('field-perspective');
    expect(once).toHaveBeenCalledWith('cameradestroy', expect.any(Function));
    vi.mocked(once).mock.calls[0]![1]();
    expect(resetPostPipeline).toHaveBeenCalledOnce();
  });

  it('keeps Canvas rendering as a safe flat fallback', () => {
    expect(attachFieldPerspective(scene(1) as never)).toBe(false);
    expect(addPostPipeline).not.toHaveBeenCalled();
    expect(setPostPipeline).not.toHaveBeenCalled();
  });
});
