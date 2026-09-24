import { dot, length, sub, type Vec2 } from './math';

export interface Circle {
  c: Vec2;
  r: number;
}

export interface Capsule {
  a: Vec2;
  b: Vec2;
  r: number;
}

/** The walkable area is a union of island discs and bridge capsules, minus obstacle discs. */
export interface WalkArea {
  islands: Circle[];
  bridges: Capsule[];
  obstacles: Circle[];
}

export function sdCircle(p: Vec2, s: Circle): number {
  return length(sub(p, s.c)) - s.r;
}

export function sdCapsule(p: Vec2, s: Capsule): number {
  const pa = sub(p, s.a);
  const ba = sub(s.b, s.a);
  const h = Math.min(1, Math.max(0, dot(pa, ba) / Math.max(dot(ba, ba), 1e-9)));
  return length({ x: pa.x - ba.x * h, z: pa.z - ba.z * h }) - s.r;
}

/** Signed distance to the walkable union (negative inside). */
export function sdWalkable(area: WalkArea, p: Vec2): number {
  let d = Number.POSITIVE_INFINITY;
  for (const s of area.islands) d = Math.min(d, sdCircle(p, s));
  for (const s of area.bridges) d = Math.min(d, sdCapsule(p, s));
  return d;
}

/** A body of `radius` fits at p: fully inside the walkable union and clear of every obstacle. */
export function canStand(area: WalkArea, p: Vec2, radius: number): boolean {
  if (sdWalkable(area, p) > -radius) return false;
  for (const o of area.obstacles) if (sdCircle(p, o) < radius) return false;
  return true;
}

/**
 * Moves by `delta`, sliding along edges: the full step if it fits, otherwise only its x part,
 * otherwise only its z part, otherwise no movement.
 */
export function slideMove(area: WalkArea, from: Vec2, delta: Vec2, radius: number): Vec2 {
  const candidates: Vec2[] = [
    { x: from.x + delta.x, z: from.z + delta.z },
    { x: from.x + delta.x, z: from.z },
    { x: from.x, z: from.z + delta.z },
  ];
  for (const p of candidates) if (canStand(area, p, radius)) return p;
  return from;
}
