export interface CameraPoint {
  x: number;
  y: number;
}

export interface CameraViewport {
  width: number;
  height: number;
  zoom: number;
}

export interface CameraBounds extends CameraPoint {
  width: number;
  height: number;
}

const axisScroll = (point: number, viewport: number, start: number, size: number): number => {
  const min = Math.ceil(start);
  const max = Math.max(min, Math.floor(start + size - viewport));
  return Math.min(max, Math.max(min, Math.round(point - viewport / 2)));
};

/** A centered, integer world-pixel scroll position constrained to the current map. */
export function cameraScrollForPoint(
  point: CameraPoint,
  viewport: CameraViewport,
  bounds: CameraBounds,
): CameraPoint {
  const worldWidth = viewport.width / viewport.zoom;
  const worldHeight = viewport.height / viewport.zoom;
  return {
    x: axisScroll(point.x, worldWidth, bounds.x, bounds.width),
    y: axisScroll(point.y, worldHeight, bounds.y, bounds.height),
  };
}
