import Phaser from 'phaser';
import {
  FIELD_PERSPECTIVE_FOREGROUND_EXPANSION,
  FIELD_PERSPECTIVE_VERTICAL_CURVE,
} from './fieldPerspectiveMath';

const PIPELINE_KEY = 'field-perspective';

const FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main(void) {
  const float curve = ${FIELD_PERSPECTIVE_VERTICAL_CURVE};
  float outputY = 1.0 - outTexCoord.y;
  float sourceY = (-(1.0 - curve) + sqrt(pow(1.0 - curve, 2.0) + 4.0 * curve * outputY)) / (2.0 * curve);
  float scale = 1.0 + ${FIELD_PERSPECTIVE_FOREGROUND_EXPANSION} * sourceY;
  float sourceX = 0.5 + (outTexCoord.x - 0.5) / scale;
  gl_FragColor = texture2D(uMainSampler, vec2(sourceX, 1.0 - sourceY));
}
`;

class FieldPerspectivePipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, fragShader: FRAGMENT_SHADER });
  }
}

/** Applies fixed-view perspective to the world camera. Canvas keeps the flat safe fallback. */
export function attachFieldPerspective(scene: Phaser.Scene): boolean {
  if (scene.game.renderer.type !== Phaser.WEBGL) return false;
  const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  const camera = scene.cameras.main;
  renderer.pipelines.addPostPipeline(PIPELINE_KEY, FieldPerspectivePipeline);
  camera.setPostPipeline(PIPELINE_KEY);
  // Camera.destroy does not release custom post pipelines.
  camera.once(Phaser.Cameras.Scene2D.Events.DESTROY, () => camera.resetPostPipeline());
  return true;
}
