import { describe, expect, it } from 'vitest';
import {
  cascadeRect,
  clampRect,
  intersects,
  isInside,
  layoutRect,
  rectFromPoints,
  resizeRect,
  snapSideAt,
} from '@/os/kernel/geometry';

const area = { w: 1000, h: 600 };
const min = { w: 200, h: 120 };

describe('clampRect', () => {
  it('pulls a rect back inside the area', () => {
    expect(clampRect({ x: -40, y: 700, w: 300, h: 200 }, area, min)).toEqual({
      x: 0,
      y: 400,
      w: 300,
      h: 200,
    });
  });

  it('shrinks rects larger than the area', () => {
    expect(clampRect({ x: 10, y: 10, w: 2000, h: 900 }, area, min)).toEqual({
      x: 0,
      y: 0,
      w: 1000,
      h: 600,
    });
  });

  it('never goes below the minimum size when it fits', () => {
    expect(clampRect({ x: 0, y: 0, w: 10, h: 10 }, area, min)).toMatchObject({ w: 200, h: 120 });
  });

  it('rounds to whole art pixels', () => {
    expect(clampRect({ x: 10.4, y: 20.6, w: 300.5, h: 200.2 }, area, min)).toEqual({
      x: 10,
      y: 21,
      w: 301,
      h: 200,
    });
  });
});

describe('layouts and snapping', () => {
  const rect = { x: 50, y: 60, w: 300, h: 200 };

  it('splits the area in two halves that cover it exactly', () => {
    const odd = { w: 1001, h: 600 };
    const left = layoutRect('left', rect, odd);
    const right = layoutRect('right', rect, odd);
    expect(left.w + right.w).toBe(1001);
    expect(right.x).toBe(left.w);
  });

  it('maximizes to the whole area and keeps the restore rect for normal', () => {
    expect(layoutRect('maximized', rect, area)).toEqual({ x: 0, y: 0, w: 1000, h: 600 });
    expect(layoutRect('normal', rect, area)).toBe(rect);
  });

  it('detects the edge under the pointer', () => {
    expect(snapSideAt({ x: 500, y: 0 }, area)).toBe('top');
    expect(snapSideAt({ x: 0, y: 300 }, area)).toBe('left');
    expect(snapSideAt({ x: 999, y: 300 }, area)).toBe('right');
    expect(snapSideAt({ x: 500, y: 300 }, area)).toBeNull();
  });
});

describe('resizeRect', () => {
  const start = { x: 100, y: 100, w: 400, h: 300 };

  it('grows from the south-east corner up to the area edge', () => {
    expect(resizeRect(start, 'se', 1000, 1000, min, area)).toEqual({
      x: 100,
      y: 100,
      w: 900,
      h: 500,
    });
  });

  it('keeps the opposite edge fixed when dragging north-west', () => {
    const r = resizeRect(start, 'nw', 50, 30, min, area);
    expect(r.x + r.w).toBe(500);
    expect(r.y + r.h).toBe(400);
  });

  it('stops at the minimum size', () => {
    const r = resizeRect(start, 'w', 1000, 0, min, area);
    expect(r.w).toBe(200);
    expect(r.x + r.w).toBe(500);
  });
});

describe('helpers', () => {
  it('cascades new windows inside the area', () => {
    for (let i = 0; i < 20; i++) {
      expect(isInside(cascadeRect(i, { w: 400, h: 300 }, area, min), area)).toBe(true);
    }
  });

  it('builds marquee rects in any drag direction and tests overlap', () => {
    const marquee = rectFromPoints({ x: 50, y: 50 }, { x: 10, y: 10 });
    expect(marquee).toEqual({ x: 10, y: 10, w: 40, h: 40 });
    expect(intersects(marquee, { x: 45, y: 45, w: 10, h: 10 })).toBe(true);
    expect(intersects(marquee, { x: 50, y: 50, w: 10, h: 10 })).toBe(false);
  });
});
