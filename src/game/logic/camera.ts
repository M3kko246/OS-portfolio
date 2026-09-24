/** True isometric elevation: atan(1 / sqrt(2)), about 35.26 degrees. */
export const ISO_ELEVATION = Math.atan(1 / Math.SQRT2);

/** Discrete zoom levels (frustum scale); index 2 is the default. */
export const ZOOM_LEVELS = [0.6, 0.8, 1, 1.3, 1.7] as const;

export type Vec3 = readonly [x: number, y: number, z: number];

/** Camera yaw for a quarter-turn index: 45 degrees plus 90 per step. */
export function yawFor(index: number): number {
  return Math.PI / 4 + index * (Math.PI / 2);
}

/** Offset from the target to the camera, at the iso elevation. */
export function cameraOffset(yawIndex: number, distance: number): Vec3 {
  const yaw = yawFor(yawIndex);
  const horizontal = Math.cos(ISO_ELEVATION) * distance;
  return [
    Math.sin(yaw) * horizontal,
    Math.sin(ISO_ELEVATION) * distance,
    Math.cos(yaw) * horizontal,
  ];
}

/**
 * Camera right and up axes, and the forward direction on the ground: input directions derive
 * from these, never from hand-written constants, because the camera turns.
 */
export function cameraBasis(yawIndex: number): { right: Vec3; up: Vec3; forward: Vec3 } {
  const yaw = yawFor(yawIndex);
  const e = ISO_ELEVATION;
  // View direction points from the camera to the target.
  const view: Vec3 = [-Math.sin(yaw) * Math.cos(e), -Math.sin(e), -Math.cos(yaw) * Math.cos(e)];
  const right: Vec3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const up: Vec3 = [
    right[1] * view[2] - right[2] * view[1],
    right[2] * view[0] - right[0] * view[2],
    right[0] * view[1] - right[1] * view[0],
  ];
  const flat = Math.hypot(view[0], view[2]);
  return { right, up, forward: [view[0] / flat, 0, view[2] / flat] };
}

const dot3 = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Moves a camera target so its projection on the camera's right and up axes falls on whole
 * game pixels. With the camera snapped, still geometry keeps its pixels while the camera moves.
 */
export function snapToPixelGrid(target: Vec3, yawIndex: number, worldPixel: number): Vec3 {
  if (worldPixel <= 0) return target;
  const { right, up } = cameraBasis(yawIndex);
  const r = dot3(target, right);
  const u = dot3(target, up);
  const dr = Math.round(r / worldPixel) * worldPixel - r;
  const du = Math.round(u / worldPixel) * worldPixel - u;
  return [
    target[0] + right[0] * dr + up[0] * du,
    target[1] + right[1] * dr + up[1] * du,
    target[2] + right[2] * dr + up[2] * du,
  ];
}

/** Size of one game pixel in world units for an orthographic frustum. */
export function worldPixelSize(frustumHeight: number, zoom: number, gameRows: number): number {
  return frustumHeight / zoom / Math.max(1, gameRows);
}

/** Device pixels per game pixel: about 270 game rows at any resolution (PROMPT.md §3.9). */
export function pixelSizeFor(deviceHeight: number): number {
  return Math.max(2, Math.round(deviceHeight / 270));
}
