import type { WorldLayout } from './layout';
import { distance, type Vec2 } from './math';
import { sdCapsule, sdCircle } from './walkable';

export interface Edge {
  a: number;
  b: number;
  w: number;
}

/** Shortest path of node indices from start to goal, or null when unreachable. */
export function dijkstra(
  nodeCount: number,
  edges: readonly Edge[],
  start: number,
  goal: number,
): number[] | null {
  const dist = new Array<number>(nodeCount).fill(Number.POSITIVE_INFINITY);
  const prev = new Array<number>(nodeCount).fill(-1);
  const done = new Array<boolean>(nodeCount).fill(false);
  dist[start] = 0;
  for (let round = 0; round < nodeCount; round++) {
    let u = -1;
    for (let i = 0; i < nodeCount; i++) {
      if (!done[i] && (u === -1 || (dist[i] ?? Infinity) < (dist[u] ?? Infinity))) u = i;
    }
    if (u === -1 || dist[u] === Number.POSITIVE_INFINITY) break;
    done[u] = true;
    if (u === goal) break;
    for (const e of edges) {
      const v = e.a === u ? e.b : e.b === u ? e.a : -1;
      if (v === -1) continue;
      const alt = (dist[u] ?? Infinity) + e.w;
      if (alt < (dist[v] ?? Infinity)) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }
  if (dist[goal] === Number.POSITIVE_INFINITY) return null;
  const path: number[] = [];
  for (let at = goal; at !== -1; at = prev[at] ?? -1) path.unshift(at);
  return path;
}

/** The island or bridge the point stands on, as the nearest island index. */
export function islandAt(layout: WorldLayout, p: Vec2): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  layout.islands.forEach((island, i) => {
    const d = sdCircle(p, { c: island.center, r: island.radius });
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  for (const bridge of layout.bridges) {
    if (sdCapsule(p, bridge) <= 0) {
      return distance(p, bridge.a) < distance(p, bridge.b) ? bridge.from : bridge.to;
    }
  }
  return best;
}

/**
 * Waypoints to walk from `from` to an island's interaction spot: through island centres and
 * along bridges, the corridors that the world layout keeps free of props.
 */
export function routeToIsland(layout: WorldLayout, from: Vec2, target: number): Vec2[] {
  const start = islandAt(layout, from);
  const edges = layout.bridges.map((b) => ({ a: b.from, b: b.to, w: distance(b.a, b.b) }));
  const nodes = dijkstra(layout.islands.length, edges, start, target);
  if (!nodes) return [];
  const points: Vec2[] = [];
  const first = layout.islands[start];
  if (first) points.push(first.center);
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1] ?? 0;
    const b = nodes[i] ?? 0;
    const bridge = layout.bridges.find(
      (x) => (x.from === a && x.to === b) || (x.from === b && x.to === a),
    );
    if (bridge) {
      const forward = bridge.from === a;
      points.push(forward ? bridge.a : bridge.b, forward ? bridge.b : bridge.a);
    }
    const island = layout.islands[b];
    if (island) points.push(island.center);
  }
  const goal = layout.islands[target];
  if (goal) points.push(goal.spot);
  return points;
}

/** Length of a walk through the waypoints, used to prefer teleporting on long trips. */
export function routeLength(from: Vec2, points: readonly Vec2[]): number {
  let total = 0;
  let at = from;
  for (const p of points) {
    total += distance(at, p);
    at = p;
  }
  return total;
}
