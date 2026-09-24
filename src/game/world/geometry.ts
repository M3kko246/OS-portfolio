import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { PaletteName } from '@/design/palette';
import { NEXT, PORTO, type IslandSpec, type Landmark } from '@/game/logic/layout';
import { rng } from '@/game/logic/math';

/** A shape of one colour. Pieces of the same colour are merged into one mesh per island. */
export interface Piece {
  color: PaletteName;
  geometry: BufferGeometry;
  emissive?: boolean;
}

const up = new Vector3(0, 1, 0);

function place(
  geometry: BufferGeometry,
  position: [number, number, number],
  rotationY = 0,
  scale: [number, number, number] = [1, 1, 1],
): BufferGeometry {
  const m = new Matrix4().compose(
    new Vector3(...position),
    new Quaternion().setFromAxisAngle(up, rotationY),
    new Vector3(...scale),
  );
  return geometry.applyMatrix4(m);
}

/** Low-poly island: a jagged cliff under a flat top, and a beach ring at the waterline. */
function islandGround(island: IslandSpec): Piece[] {
  const random = rng(island.seed);
  const segments = 12;
  const cliff = new CylinderGeometry(island.radius, island.radius * 1.08, 1.4, segments, 1);
  const positions = cliff.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const k = 1 + (random() - 0.5) * 0.12;
    positions.setXYZ(i, x * k, positions.getY(i), z * k);
  }
  cliff.computeVertexNormals();
  place(cliff, [0, -0.7, 0]);
  const beach = place(
    new CylinderGeometry(island.radius + 0.9, island.radius + 1.3, 0.3, segments),
    [0, -0.45, 0],
  );
  const top: Record<IslandSpec['biome'], PaletteName> = {
    meadow: 'meadow',
    grove: 'olive',
    sand: 'sand',
    rock: 'fog',
  };
  return [
    { color: top[island.biome], geometry: cliff },
    { color: 'sand', geometry: beach },
  ];
}

function box(w: number, h: number, d: number, at: [number, number, number], rotationY = 0) {
  return place(new BoxGeometry(w, h, d), at, rotationY);
}

function cylinder(
  rTop: number,
  rBottom: number,
  h: number,
  sides: number,
  at: [number, number, number],
) {
  return place(new CylinderGeometry(rTop, rBottom, h, sides), at);
}

/** Each landmark has its own silhouette, readable at 270 rows. Built at the origin, facing +z. */
export function landmarkPieces(kind: Landmark): Piece[] {
  switch (kind) {
    case 'lighthouse':
      return [
        ...[0, 1, 2, 3, 4].map((i): Piece => ({
          color: i % 2 ? 'brick' : 'paper',
          geometry: cylinder(0.62 - i * 0.05 - 0.05, 0.62 - i * 0.05, 0.85, 8, [
            0,
            0.425 + i * 0.85,
            0,
          ]),
        })),
        { color: 'slate', geometry: cylinder(0.75, 0.75, 0.15, 8, [0, 4.3, 0]) },
        { color: 'sun', geometry: cylinder(0.38, 0.38, 0.55, 8, [0, 4.65, 0]), emissive: true },
        { color: 'brick', geometry: place(new ConeGeometry(0.5, 0.6, 8), [0, 5.2, 0]) },
      ];
    case 'tower':
      return [
        { color: 'slate', geometry: box(1.7, 3.6, 1.7, [0, 1.8, 0]) },
        ...[
          [-0.65, -0.65],
          [0.65, -0.65],
          [-0.65, 0.65],
          [0.65, 0.65],
        ].map(([x = 0, z = 0]): Piece => ({
          color: 'fog',
          geometry: box(0.45, 0.5, 0.45, [x, 3.85, z]),
        })),
        { color: 'sun', geometry: box(0.35, 0.6, 0.1, [0, 2.4, 0.86]), emissive: true },
      ];
    case 'workshop':
      return [
        { color: 'sand', geometry: box(2.6, 1.5, 1.9, [0, 0.75, 0]) },
        // Gable roof: two slabs leaning on each other.
        ...[-1, 1].map((side): Piece => ({
          color: 'brick',
          geometry: new BoxGeometry(2.9, 0.14, 1.3).applyMatrix4(
            new Matrix4().compose(
              new Vector3(0, 1.85, side * 0.48),
              new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), side * 0.62),
              new Vector3(1, 1, 1),
            ),
          ),
        })),
        { color: 'slate', geometry: box(0.35, 1.1, 0.35, [0.8, 2.6, -0.3]) },
        { color: 'ink', geometry: box(0.6, 0.9, 0.05, [0, 0.45, 0.96]) },
      ];
    case 'observatory':
      return [
        { color: 'chalk', geometry: cylinder(1.15, 1.25, 1.4, 10, [0, 0.7, 0]) },
        {
          color: 'paper',
          geometry: place(
            new SphereGeometry(1.15, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
            [0, 1.4, 0],
          ),
        },
        { color: 'ink', geometry: box(0.3, 0.9, 0.4, [0, 2.1, 0.9]) },
      ];
    case 'windmill':
      return [
        { color: 'paper', geometry: cylinder(0.6, 0.95, 3.2, 6, [0, 1.6, 0]) },
        { color: 'brick', geometry: place(new ConeGeometry(0.75, 0.9, 6), [0, 3.65, 0]) },
      ];
    case 'dock':
      return [
        { color: 'sand', geometry: box(1.4, 0.18, 4.2, [0, 0.05, 1.2]) },
        ...[-1, 1].flatMap((side) =>
          [0.2, 1.6, 3].map((z): Piece => ({
            color: 'olive',
            geometry: box(0.18, 1, 0.18, [side * 0.62, -0.3, z]),
          })),
        ),
        { color: 'brick', geometry: box(0.7, 0.6, 0.7, [-0.3, 0.45, -0.6]) },
        { color: 'sand', geometry: box(0.55, 0.5, 0.55, [0.35, 0.4, -0.4]) },
      ];
  }
}

/** Windmill blades, animated separately. */
export function windmillBlades(): BufferGeometry {
  return mergeGeometries([box(0.18, 3.2, 0.05, [0, 0, 0]), box(3.2, 0.18, 0.05, [0, 0, 0])]);
}

/** Porto: hut (Chi sono), mailbox (Contatti), sign with the controls, flag. */
export function portoPieces(): Piece[] {
  const { hut, mailbox, sign, flag } = PORTO;
  return [
    { color: 'sand', geometry: box(2.2, 1.4, 1.8, [hut.x, 0.7, hut.z]) },
    {
      color: 'brick',
      geometry: place(new ConeGeometry(1.7, 1.1, 4), [hut.x, 1.95, hut.z], Math.PI / 4),
    },
    { color: 'ink', geometry: box(0.5, 0.8, 0.05, [hut.x, 0.4, hut.z + 0.91]) },
    { color: 'olive', geometry: box(0.12, 1, 0.12, [mailbox.x, 0.5, mailbox.z]) },
    { color: 'brick', geometry: box(0.5, 0.4, 0.35, [mailbox.x, 1.15, mailbox.z]) },
    { color: 'olive', geometry: box(0.12, 1.3, 0.12, [sign.x, 0.65, sign.z]) },
    { color: 'sand', geometry: box(1.4, 0.8, 0.1, [sign.x, 1.3, sign.z]) },
    { color: 'slate', geometry: box(0.08, 3.6, 0.08, [flag.x, 1.8, flag.z]) },
    { color: 'sun', geometry: box(1, 0.6, 0.05, [flag.x + 0.5, 3.2, flag.z]) },
  ];
}

/** Next island: scaffolding around an unfinished shape, and a sign. */
export function nextPieces(): Piece[] {
  const { scaffold, sign } = NEXT;
  const poles = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].map(([x = 0, z = 0]): Piece => ({
    color: 'olive',
    geometry: box(0.1, 3, 0.1, [scaffold.x + x, 1.5, scaffold.z + z]),
  }));
  return [
    ...poles,
    { color: 'sand', geometry: box(2.2, 0.08, 0.1, [scaffold.x, 1.2, scaffold.z - 1]) },
    { color: 'sand', geometry: box(2.2, 0.08, 0.1, [scaffold.x, 2.4, scaffold.z + 1]) },
    { color: 'chalk', geometry: box(1.4, 1.2, 1.4, [scaffold.x, 0.6, scaffold.z]) },
    { color: 'olive', geometry: box(0.12, 1.2, 0.12, [sign.x, 0.6, sign.z]) },
    { color: 'sand', geometry: box(1.4, 0.7, 0.1, [sign.x, 1.25, sign.z]) },
  ];
}

export function totemPieces(): Piece[] {
  return [
    { color: 'ink', geometry: box(0.18, 1.4, 0.18, [0, 0.7, -0.08]) },
    { color: 'ink', geometry: box(1.72, 1.12, 0.1, [0, 1.75, -0.02]) },
  ];
}

export function islandPieces(island: IslandSpec): Piece[] {
  return islandGround(island);
}

export const treeGeometry = {
  trunk: () => place(new CylinderGeometry(0.12, 0.16, 0.8, 5), [0, 0.4, 0]),
  crown: () => place(new ConeGeometry(0.75, 1.6, 6), [0, 1.5, 0]),
};

export const rockGeometry = () =>
  place(new IcosahedronGeometry(0.55, 0), [0, 0.2, 0], 0, [1, 0.7, 1]);

/** Merges pieces by colour: one mesh per colour and group keeps draw calls low. */
export function mergeByColor(pieces: Piece[]): Piece[] {
  const groups = new Map<string, Piece[]>();
  for (const piece of pieces) {
    const key = `${piece.color}:${piece.emissive ? 'e' : ''}`;
    groups.set(key, [...(groups.get(key) ?? []), piece]);
  }
  return [...groups.values()].map((group) => {
    const first = group[0] as Piece;
    const geometries = group.map((p) =>
      p.geometry.index ? p.geometry.toNonIndexed() : p.geometry,
    );
    geometries.forEach((g) => {
      for (const name of Object.keys(g.attributes))
        if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    });
    return {
      color: first.color,
      geometry: mergeGeometries(geometries),
      ...(first.emissive ? { emissive: true } : {}),
    };
  });
}
