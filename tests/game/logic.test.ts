import { describe, expect, it } from 'vitest';
import {
  cameraBasis,
  cameraOffset,
  ISO_ELEVATION,
  pixelSizeFor,
  snapToPixelGrid,
} from '@/game/logic/camera';
import { layoutWorld, PLAYER_RADIUS, type ProjectInput } from '@/game/logic/layout';
import { angleDelta, distance } from '@/game/logic/math';
import { dijkstra, islandAt, routeToIsland } from '@/game/logic/pathfinding';
import { canStand, sdCapsule, sdCircle, slideMove, type WalkArea } from '@/game/logic/walkable';

const projects: ProjectInput[] = [3, 1, 2, 4, 5, 6].map((order) => ({
  slug: `progetto-${order}`,
  order,
  island: { biome: 'meadow', landmark: 'lighthouse' },
}));

describe('walkable area', () => {
  const area: WalkArea = {
    islands: [{ c: { x: 0, z: 0 }, r: 5 }],
    bridges: [{ a: { x: 4, z: 0 }, b: { x: 12, z: 0 }, r: 1 }],
    obstacles: [{ c: { x: 0, z: 2 }, r: 1 }],
  };

  it('computes signed distances', () => {
    expect(sdCircle({ x: 3, z: 4 }, { c: { x: 0, z: 0 }, r: 5 })).toBeCloseTo(0);
    expect(sdCapsule({ x: 8, z: 1 }, { a: { x: 4, z: 0 }, b: { x: 12, z: 0 }, r: 1 })).toBeCloseTo(
      0,
    );
  });

  it('keeps the body inside the union and out of obstacles', () => {
    expect(canStand(area, { x: 0, z: 0 }, 0.35)).toBe(true);
    expect(canStand(area, { x: 4.8, z: 0 }, 0.35)).toBe(true);
    expect(canStand(area, { x: 8, z: 0.8 }, 0.35)).toBe(false);
    expect(canStand(area, { x: 0, z: 1.5 }, 0.35)).toBe(false);
  });

  it('slides along an edge instead of stopping', () => {
    // The diagonal step would leave the 1-unit bridge; its x part still fits.
    const moved = slideMove(area, { x: 8, z: 0 }, { x: 0.5, z: 0.8 }, 0.35);
    expect(moved).toEqual({ x: 8.5, z: 0 });
  });

  it('stays put when no axis fits', () => {
    expect(slideMove(area, { x: 12.5, z: 0 }, { x: 2, z: 2 }, 0.35)).toEqual({ x: 12.5, z: 0 });
  });
});

describe('world layout', () => {
  const world = layoutWorld(projects);

  it('is deterministic and independent of input order', () => {
    expect(layoutWorld([...projects].reverse())).toEqual(world);
  });

  it('places Porto, one island per project in order, then the next island', () => {
    expect(world.islands.map((i) => i.id)).toEqual([
      'porto',
      'progetto-1',
      'progetto-2',
      'progetto-3',
      'progetto-4',
      'progetto-5',
      'progetto-6',
      'next',
    ]);
    expect(world.bridges).toHaveLength(7);
  });

  it('keeps islands apart and every interaction spot reachable', () => {
    for (let i = 1; i < world.islands.length; i++) {
      const a = world.islands[i - 1];
      const b = world.islands[i];
      if (!a || !b) continue;
      expect(distance(a.center, b.center)).toBeGreaterThan(a.radius + b.radius + 2);
    }
    for (const island of world.islands) {
      expect(canStand(world.area, island.spot, PLAYER_RADIUS)).toBe(true);
      expect(canStand(world.area, island.center, PLAYER_RADIUS)).toBe(true);
    }
  });

  it('keeps bridge ends and walking corridors walkable', () => {
    for (const bridge of world.bridges) {
      for (let k = 0; k <= 10; k++) {
        const p = {
          x: bridge.a.x + ((bridge.b.x - bridge.a.x) * k) / 10,
          z: bridge.a.z + ((bridge.b.z - bridge.a.z) * k) / 10,
        };
        expect(canStand(world.area, p, PLAYER_RADIUS)).toBe(true);
      }
    }
  });
});

describe('route finding', () => {
  const world = layoutWorld(projects);

  it('finds shortest paths with Dijkstra', () => {
    const edges = [
      { a: 0, b: 1, w: 1 },
      { a: 1, b: 2, w: 1 },
      { a: 0, b: 2, w: 5 },
      { a: 2, b: 3, w: 1 },
    ];
    expect(dijkstra(4, edges, 0, 3)).toEqual([0, 1, 2, 3]);
    expect(dijkstra(5, edges, 0, 4)).toBeNull();
  });

  it('walks every waypoint of a route without leaving the walkable area', () => {
    const start = world.islands[0]?.center ?? { x: 0, z: 0 };
    const route = routeToIsland(world, start, 5);
    expect(route.at(-1)).toEqual(world.islands[5]?.spot);
    let at = start;
    for (const target of route) {
      for (let k = 1; k <= 20; k++) {
        const p = {
          x: at.x + ((target.x - at.x) * k) / 20,
          z: at.z + ((target.z - at.z) * k) / 20,
        };
        expect(canStand(world.area, p, PLAYER_RADIUS)).toBe(true);
      }
      at = target;
    }
    expect(islandAt(world, at)).toBe(5);
  });
});

describe('camera', () => {
  it('looks down at the true isometric angle', () => {
    const [x, y, z] = cameraOffset(0, 10);
    expect(Math.atan2(y, Math.hypot(x, z))).toBeCloseTo(ISO_ELEVATION);
    expect(ISO_ELEVATION * (180 / Math.PI)).toBeCloseTo(35.264, 2);
  });

  it('has an orthonormal basis that turns with the camera', () => {
    for (let yaw = 0; yaw < 4; yaw++) {
      const { right, up, forward } = cameraBasis(yaw);
      expect(Math.hypot(...right)).toBeCloseTo(1);
      expect(Math.hypot(...up)).toBeCloseTo(1);
      expect(right[0] * up[0] + right[1] * up[1] + right[2] * up[2]).toBeCloseTo(0);
      expect(forward[1]).toBe(0);
    }
    const a = cameraBasis(0).forward;
    const b = cameraBasis(1).forward;
    expect(a[0] * b[0] + a[2] * b[2]).toBeCloseTo(0);
  });

  it('snaps the target to whole game pixels on the camera plane', () => {
    const pixel = 0.07;
    const snapped = snapToPixelGrid([3.1234, 0.5, -7.891], 2, pixel);
    const { right, up } = cameraBasis(2);
    const r = snapped[0] * right[0] + snapped[1] * right[1] + snapped[2] * right[2];
    const u = snapped[0] * up[0] + snapped[1] * up[1] + snapped[2] * up[2];
    expect(r / pixel - Math.round(r / pixel)).toBeCloseTo(0, 6);
    expect(u / pixel - Math.round(u / pixel)).toBeCloseTo(0, 6);
  });

  it('keeps about 270 game rows', () => {
    expect(pixelSizeFor(1080)).toBe(4);
    expect(pixelSizeFor(2160)).toBe(8);
    expect(pixelSizeFor(400)).toBe(2);
  });

  it('turns by the shortest angle', () => {
    expect(angleDelta(Math.PI * 0.9, -Math.PI * 0.9)).toBeCloseTo(Math.PI * 0.2);
  });
});
