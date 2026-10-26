import {
  playerMotionPose,
  type PlayerMotionPose,
  type PlayerMotionState,
} from '../../rendering/playerMotion';

interface MotionSprite {
  texture: { key: string };
  setTexture(key: string): unknown;
  setFrame(frame: number): unknown;
  setPosition(x: number, y: number): unknown;
}

interface MotionShadow {
  setPosition(x: number, y: number): unknown;
  setScale(x: number, y: number): unknown;
}

export function presentPlayerMotion(input: {
  sprite: MotionSprite;
  shadow: MotionShadow;
  textureKey: string;
  state: PlayerMotionState;
  anchorX: number;
  anchorY: number;
}): PlayerMotionPose {
  const pose = playerMotionPose(input.state);
  if (input.sprite.texture.key !== input.textureKey) input.sprite.setTexture(input.textureKey);
  input.sprite.setFrame(pose.frame);
  input.sprite.setPosition(input.anchorX + pose.offsetX, input.anchorY + pose.offsetY);
  input.shadow.setPosition(input.anchorX, input.anchorY + 6);
  input.shadow.setScale(pose.shadowScale, pose.shadowScale);
  return pose;
}
