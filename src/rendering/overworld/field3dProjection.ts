export interface Field3dPoint {
  x: number;
  height: number;
  z: number;
}

export interface Field3dCamera {
  targetX: number;
  targetZ: number;
  focalLength: number;
  sinPitch: number;
  cosPitch: number;
}

export interface ProjectedFieldPoint {
  x: number;
  y: number;
  depth: number;
  scale: number;
}

const FIELD_CAMERA_FOV_DEGREES = 38;
const FIELD_CAMERA_PITCH_DEGREES = 65;

export function createField3dCamera(input: {
  targetX: number;
  targetZ: number;
  viewportHeight: number;
}): Field3dCamera {
  const fov = (FIELD_CAMERA_FOV_DEGREES * Math.PI) / 180;
  const pitch = (FIELD_CAMERA_PITCH_DEGREES * Math.PI) / 180;
  return {
    targetX: input.targetX,
    targetZ: input.targetZ,
    focalLength: input.viewportHeight / (2 * Math.tan(fov / 2)),
    sinPitch: Math.sin(pitch),
    cosPitch: Math.cos(pitch),
  };
}

/** Fixed pitched perspective camera matching the field camera used by the reference game. */
export function projectField3dPoint(
  point: Field3dPoint,
  camera: Field3dCamera,
  result: ProjectedFieldPoint = { x: 0, y: 0, depth: 0, scale: 0 },
): ProjectedFieldPoint {
  const dx = point.x - camera.targetX;
  const dz = point.z - camera.targetZ;
  const depth = camera.focalLength - point.height * camera.sinPitch - dz * camera.cosPitch;
  const safeDepth = Math.max(1, depth);
  const scale = camera.focalLength / safeDepth;
  result.x = dx * scale;
  result.y = (dz * camera.sinPitch - point.height * camera.cosPitch) * scale;
  result.depth = depth;
  result.scale = scale;
  return result;
}
