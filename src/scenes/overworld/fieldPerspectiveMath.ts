export const FIELD_PERSPECTIVE_FOREGROUND_EXPANSION = 0.08;
export const FIELD_PERSPECTIVE_VERTICAL_CURVE = 0.12;

const unit = (value: number): number => Math.max(0, Math.min(1, value));

export function perspectiveScale(screenY: number): number {
  return 1 + FIELD_PERSPECTIVE_FOREGROUND_EXPANSION * unit(screenY);
}

export function projectPerspectiveY(screenY: number): number {
  const y = unit(screenY);
  return y + FIELD_PERSPECTIVE_VERTICAL_CURVE * y * (y - 1);
}

export function unprojectPerspectiveY(projectedY: number): number {
  const y = unit(projectedY);
  return (
    (-(1 - FIELD_PERSPECTIVE_VERTICAL_CURVE) +
      Math.sqrt((1 - FIELD_PERSPECTIVE_VERTICAL_CURVE) ** 2 + 4 * FIELD_PERSPECTIVE_VERTICAL_CURVE * y)) /
    (2 * FIELD_PERSPECTIVE_VERTICAL_CURVE)
  );
}

export function projectPerspectivePoint(point: { x: number; y: number }): {
  x: number;
  y: number;
} {
  const y = unit(point.y);
  return {
    x: 0.5 + (point.x - 0.5) * perspectiveScale(y),
    y: projectPerspectiveY(y),
  };
}
