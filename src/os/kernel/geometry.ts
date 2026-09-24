/**
 * Window and icon geometry in art pixels (multiples of `--u`). Everything is an integer, so
 * whatever the device pixel ratio, frames land on whole device pixels.
 */
export interface Size {
  w: number;
  h: number;
}
export interface Point {
  x: number;
  y: number;
}
export interface Rect extends Point, Size {}

export type Layout = 'normal' | 'maximized' | 'left' | 'right';
export type SnapSide = 'left' | 'right' | 'top';
export type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** Keeps a rect fully inside the area, shrinking it when needed but never below `min`. */
export function clampRect(rect: Rect, area: Size, min: Size): Rect {
  const w = Math.max(Math.min(min.w, area.w), Math.min(Math.round(rect.w), area.w));
  const h = Math.max(Math.min(min.h, area.h), Math.min(Math.round(rect.h), area.h));
  const x = Math.min(Math.max(0, Math.round(rect.x)), Math.max(0, area.w - w));
  const y = Math.min(Math.max(0, Math.round(rect.y)), Math.max(0, area.h - h));
  return { x, y, w, h };
}

/** The rect a window occupies on screen for its layout. `rect` is the restore rect. */
export function layoutRect(layout: Layout, rect: Rect, area: Size): Rect {
  const half = Math.floor(area.w / 2);
  switch (layout) {
    case 'maximized':
      return { x: 0, y: 0, w: area.w, h: area.h };
    case 'left':
      return { x: 0, y: 0, w: half, h: area.h };
    case 'right':
      return { x: half, y: 0, w: area.w - half, h: area.h };
    case 'normal':
      return rect;
  }
}

export function layoutForSide(side: SnapSide): Layout {
  return side === 'top' ? 'maximized' : side;
}

/** Which edge the pointer is pressing against while a window is dragged, if any. */
export function snapSideAt(pointer: Point, area: Size, threshold = 2): SnapSide | null {
  if (pointer.y <= threshold) return 'top';
  if (pointer.x <= threshold) return 'left';
  if (pointer.x >= area.w - 1 - threshold) return 'right';
  return null;
}

/**
 * Staggered position for the n-th new window, starting right of the first icon column and
 * wrapping before windows leave the area.
 */
export function cascadeRect(index: number, size: Size, area: Size, min: Size): Rect {
  const step = 24;
  const origin = { x: 112, y: 24 };
  const room = Math.floor(Math.min(area.w - size.w - origin.x, area.h - size.h - origin.y) / step);
  const n = index % Math.max(1, Math.min(8, room + 1));
  return clampRect({ x: origin.x + n * step, y: origin.y + n * step, ...size }, area, min);
}

/** New rect after dragging a resize handle by (dx, dy), respecting the minimum size and area. */
export function resizeRect(
  start: Rect,
  edge: Edge,
  dx: number,
  dy: number,
  min: Size,
  area: Size,
): Rect {
  let { x, y, w, h } = start;
  if (edge.includes('e')) w = Math.min(Math.max(min.w, start.w + dx), area.w - start.x);
  if (edge.includes('s')) h = Math.min(Math.max(min.h, start.h + dy), area.h - start.y);
  if (edge.includes('w')) {
    x = Math.min(Math.max(0, start.x + dx), start.x + start.w - min.w);
    w = start.w + start.x - x;
  }
  if (edge.includes('n')) {
    y = Math.min(Math.max(0, start.y + dy), start.y + start.h - min.h);
    h = start.h + start.y - y;
  }
  return { x, y, w, h };
}

export function rectFromPoints(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function isInside(rect: Rect, area: Size): boolean {
  return rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= area.w && rect.y + rect.h <= area.h;
}
