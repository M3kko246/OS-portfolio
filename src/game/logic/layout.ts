import { add, distance, hashString, normalize, rng, scale, sub, vec, type Vec2 } from './math';
import type { Capsule, Circle, WalkArea } from './walkable';

export type Biome = 'meadow' | 'sand' | 'rock' | 'grove';
export type Landmark = 'lighthouse' | 'tower' | 'workshop' | 'observatory' | 'windmill' | 'dock';
export type IslandKind = 'porto' | 'project' | 'next';

export interface IslandSpec {
  id: string;
  kind: IslandKind;
  /** Project slug for project islands. */
  slug?: string;
  center: Vec2;
  radius: number;
  seed: number;
  biome: Biome;
  landmark?: Landmark;
  /** Unit vector from the centre towards the totem and the interaction spot. */
  front: Vec2;
  /** Where the player stands to interact. */
  spot: Vec2;
}

export interface Prop {
  kind: 'tree' | 'rock';
  position: Vec2;
  size: number;
  island: number;
}

export interface WorldLayout {
  islands: IslandSpec[];
  bridges: (Capsule & { from: number; to: number })[];
  props: Prop[];
  area: WalkArea;
}

export interface ProjectInput {
  slug: string;
  order: number;
  island: { biome: Biome; landmark: string; seed?: number };
}

const STEP = 22;
const LATERAL = 6;
const BRIDGE_RADIUS = 0.8;
export const PLAYER_RADIUS = 0.35;

/**
 * Features of Porto and of the next island in island space (+z faces the totem side). The same
 * numbers place the meshes, the obstacles and the interaction spots.
 */
export const PORTO = {
  hut: { x: -2.2, z: -1.4, r: 1.35, spot: { x: -2.2, z: -0.1 } },
  mailbox: { x: 2.4, z: -1.6, r: 0.35, spot: { x: 2.4, z: -0.7 } },
  sign: { x: 0.2, z: 3.1, r: 0.3, spot: { x: 0.2, z: 2.2 } },
  flag: { x: 3.3, z: -2.6, r: 0.2 },
} as const;

export const NEXT = {
  scaffold: { x: 0, z: -1.8, r: 1.3 },
  sign: { x: 0, z: 2.6, r: 0.3, spot: { x: 0, z: 1.5 } },
} as const;

/** Island space to world space: rotate by the island's facing, then move to its centre. */
export function toWorld(island: Pick<IslandSpec, 'center' | 'front'>, local: Vec2): Vec2 {
  const angle = Math.atan2(island.front.x, island.front.z);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: island.center.x + local.x * cos + local.z * sin,
    z: island.center.z - local.x * sin + local.z * cos,
  };
}

function catmullRom(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return vec(f(p0.x, p1.x, p2.x, p3.x), f(p0.z, p1.z, p2.z, p3.z));
}

/** A gentle, fixed S-shaped route: the same for everyone, only its length depends on content. */
function routeControl(i: number): Vec2 {
  return vec(i * 20, Math.sin(i * 0.8) * 9);
}

/** Samples the route and returns points at fixed arc-length steps, with their tangents. */
function placeAlongRoute(count: number): { point: Vec2; tangent: Vec2 }[] {
  const controls = Array.from({ length: count + 4 }, (_, i) => routeControl(i - 1));
  const samples: Vec2[] = [];
  for (let seg = 1; seg < controls.length - 2; seg++) {
    const [p0, p1, p2, p3] = [
      controls[seg - 1],
      controls[seg],
      controls[seg + 1],
      controls[seg + 2],
    ];
    if (!p0 || !p1 || !p2 || !p3) continue;
    for (let k = 0; k < 64; k++) samples.push(catmullRom(p0, p1, p2, p3, k / 64));
  }
  const out: { point: Vec2; tangent: Vec2 }[] = [];
  let travelled = 0;
  let next = 0;
  for (let i = 1; i < samples.length && out.length < count; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    if (!a || !b) continue;
    const segment = distance(a, b);
    while (next <= travelled + segment && out.length < count) {
      const k = (next - travelled) / segment;
      out.push({ point: add(a, scale(sub(b, a), k)), tangent: normalize(sub(b, a)) });
      next += STEP;
    }
    travelled += segment;
  }
  return out;
}

const LANDMARKS: Landmark[] = [
  'lighthouse',
  'tower',
  'workshop',
  'observatory',
  'windmill',
  'dock',
];

/**
 * The archipelago, fully determined by the projects: Porto first, one island per project in
 * route order, the unfinished next island last. Same content, same world.
 */
export function layoutWorld(projects: readonly ProjectInput[]): WorldLayout {
  const sorted = [...projects].sort((a, b) => a.order - b.order);
  const stations = placeAlongRoute(sorted.length + 2);
  const islands: IslandSpec[] = stations.map(({ point, tangent }, i) => {
    const project = i > 0 && i <= sorted.length ? sorted[i - 1] : undefined;
    const kind: IslandKind = i === 0 ? 'porto' : project ? 'project' : 'next';
    const seed = project ? (project.island.seed ?? hashString(project.slug)) : hashString(kind);
    const random = rng(seed);
    const normal = vec(-tangent.z, tangent.x);
    const side = i === 0 ? 0 : i % 2 === 0 ? 1 : -1;
    const center = add(point, scale(normal, side * LATERAL));
    const radius = kind === 'porto' ? 7 : kind === 'next' ? 4.6 : 5 + random() * 1.2;
    // The totem faces the viewer's default side of the route.
    const front = normalize(normal.z > 0 ? normal : scale(normal, -1));
    const landmark = project?.island.landmark;
    return {
      id: project?.slug ?? kind,
      kind,
      ...(project ? { slug: project.slug } : {}),
      center,
      radius,
      seed,
      biome: project?.island.biome ?? (kind === 'porto' ? 'meadow' : 'sand'),
      ...(landmark && (LANDMARKS as string[]).includes(landmark)
        ? { landmark: landmark as Landmark }
        : {}),
      front,
      spot: add(center, scale(front, radius * 0.25)),
    };
  });

  const bridges = islands.slice(1).map((to, i) => {
    const from = islands[i] as IslandSpec;
    const dir = normalize(sub(to.center, from.center));
    return {
      from: i,
      to: i + 1,
      a: add(from.center, scale(dir, from.radius - 0.9)),
      b: sub(to.center, scale(dir, to.radius - 0.9)),
      r: BRIDGE_RADIUS,
    };
  });

  const obstacles: Circle[] = [];
  const props: Prop[] = [];
  islands.forEach((island, index) => {
    if (island.kind === 'project') {
      // The landmark stands behind the centre, the totem in front of it.
      obstacles.push({ c: add(island.center, scale(island.front, -island.radius * 0.42)), r: 1.2 });
      obstacles.push({ c: add(island.center, scale(island.front, island.radius * 0.55)), r: 0.35 });
    } else {
      const features = island.kind === 'porto' ? Object.values(PORTO) : Object.values(NEXT);
      for (const f of features) obstacles.push({ c: toWorld(island, { x: f.x, z: f.z }), r: f.r });
    }
    // Vegetation keeps clear of the walking corridors: centre, totem and bridge ends.
    const random = rng(island.seed ^ 0x9e3779b9);
    const featureSpots =
      island.kind === 'porto'
        ? [PORTO.hut.spot, PORTO.mailbox.spot, PORTO.sign.spot]
        : island.kind === 'next'
          ? [NEXT.sign.spot]
          : [];
    const keepClear = [
      island.center,
      island.spot,
      ...featureSpots.map((s) => toWorld(island, s)),
      ...bridges.flatMap((b) => [b.from === index ? b.a : null, b.to === index ? b.b : null]),
    ].filter((p): p is Vec2 => p !== null);
    const wanted = island.kind === 'project' ? (island.biome === 'grove' ? 9 : 5) : 3;
    for (
      let attempt = 0;
      attempt < 60 && props.filter((p) => p.island === index).length < wanted;
      attempt++
    ) {
      const angle = random() * Math.PI * 2;
      const r = (0.45 + random() * 0.4) * island.radius;
      const position = add(island.center, vec(Math.cos(angle) * r, Math.sin(angle) * r));
      const clear =
        keepClear.every((p) => distance(p, position) > 2.4) &&
        corridorClear(position, island, bridges, index) &&
        obstacles.every((o) => distance(o.c, position) > o.r + 1.2);
      if (!clear) continue;
      const kind: Prop['kind'] = island.biome === 'rock' || random() < 0.25 ? 'rock' : 'tree';
      const size = 0.6 + random() * 0.5;
      props.push({ kind, position, size, island: index });
      obstacles.push({ c: position, r: kind === 'tree' ? 0.45 * size : 0.55 * size });
    }
  });

  return {
    islands,
    bridges,
    props,
    area: {
      islands: islands.map((i) => ({ c: i.center, r: i.radius - 0.4 })),
      bridges: bridges.map(({ a, b, r }) => ({ a, b, r })),
      obstacles,
    },
  };
}

/** True if a prop at p stays clear of the straight walks centre-spot and centre-bridge ends. */
function corridorClear(
  p: Vec2,
  island: IslandSpec,
  bridges: { from: number; to: number; a: Vec2; b: Vec2 }[],
  index: number,
): boolean {
  const ends = [island.spot];
  for (const b of bridges) {
    if (b.from === index) ends.push(b.a);
    if (b.to === index) ends.push(b.b);
  }
  return ends.every((end) => distanceToSegment(p, island.center, end) > 1.6);
}

function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = sub(b, a);
  const len2 = ab.x * ab.x + ab.z * ab.z;
  const t =
    len2 === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * ab.x + (p.z - a.z) * ab.z) / len2));
  return distance(p, add(a, scale(ab, t)));
}
