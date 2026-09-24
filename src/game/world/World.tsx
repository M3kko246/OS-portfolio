import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BoxGeometry,
  CircleGeometry,
  Color,
  type Group,
  type InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NearestFilter,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { palette, type PaletteName } from '@/design/palette';
import type { TimeOfDay } from '@/design/time';
import type { IslandSpec, WorldLayout } from '@/game/logic/layout';
import type { ProjectSummary } from '@/os/types';
import {
  islandPieces,
  landmarkPieces,
  mergeByColor,
  nextPieces,
  portoPieces,
  rockGeometry,
  totemPieces,
  treeGeometry,
  windmillBlades,
  type Piece,
} from './geometry';
import type { MaterialKit } from './materials';

export const WATER_LEVEL = -0.42;

export const LIGHTING: Record<
  TimeOfDay,
  {
    sky: PaletteName;
    water: PaletteName;
    sun: PaletteName;
    sunIntensity: number;
    ambient: number;
    lamps: boolean;
  }
> = {
  dawn: { sky: 'sand', water: 'sea', sun: 'sun', sunIntensity: 2.2, ambient: 1.4, lamps: true },
  day: { sky: 'foam', water: 'sea', sun: 'paper', sunIntensity: 2.8, ambient: 1.6, lamps: false },
  dusk: { sky: 'plum', water: 'abyss', sun: 'sun', sunIntensity: 2, ambient: 1.2, lamps: true },
  night: { sky: 'night', water: 'abyss', sun: 'fog', sunIntensity: 1.1, ambient: 0.9, lamps: true },
};

const facing = (island: IslandSpec) => Math.atan2(island.front.x, island.front.z);

function Pieces({ pieces, kit, lamps }: { pieces: Piece[]; kit: MaterialKit; lamps: boolean }) {
  return (
    <>
      {pieces.map((piece) => (
        <mesh
          key={`${piece.color}${piece.emissive ? '-e' : ''}`}
          geometry={piece.geometry}
          material={kit.get(piece.color, { emissive: Boolean(piece.emissive) && lamps })}
          castShadow
          receiveShadow
        />
      ))}
    </>
  );
}

function Windmill({ kit }: { kit: MaterialKit }) {
  const bladesRef = useRef<Group>(null);
  const geometry = useMemo(() => windmillBlades(), []);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  useFrame((_, delta) => {
    if (bladesRef.current) bladesRef.current.rotation.z += delta * 0.9;
  });
  return (
    <group ref={bladesRef} position={[0, 2.9, 0.72]}>
      <mesh geometry={geometry} material={kit.get('ink')} castShadow />
    </group>
  );
}

function Totem({ project, kit }: { project: ProjectSummary | undefined; kit: MaterialKit }) {
  const pieces = useMemo(() => mergeByColor(totemPieces()), []);
  const [texture, setTexture] = useState<Texture | null>(null);
  const screen = useMemo(() => new PlaneGeometry(1.6, 1), []);
  const material = useMemo(() => new MeshBasicMaterial({ color: palette.chalk }), []);

  useEffect(() => {
    if (!project) return;
    let disposed = false;
    new TextureLoader().load(project.cover.src, (loaded) => {
      if (disposed) {
        loaded.dispose();
        return;
      }
      // The cover enters the world as pixels: nearest filtering, no mipmaps, sRGB.
      loaded.magFilter = NearestFilter;
      loaded.minFilter = NearestFilter;
      loaded.generateMipmaps = false;
      loaded.colorSpace = SRGBColorSpace;
      material.map = loaded;
      material.color = new Color(0xffffff);
      material.needsUpdate = true;
      setTexture(loaded);
    });
    return () => {
      disposed = true;
    };
  }, [project, material]);

  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture],
  );
  useEffect(
    () => () => {
      screen.dispose();
      material.dispose();
      for (const p of pieces) p.geometry.dispose();
    },
    [screen, material, pieces],
  );

  return (
    <group>
      <Pieces pieces={pieces} kit={kit} lamps={false} />
      <mesh geometry={screen} material={material} position={[0, 1.75, 0.04]} />
    </group>
  );
}

function Island({
  island,
  project,
  kit,
  lamps,
}: {
  island: IslandSpec;
  project: ProjectSummary | undefined;
  kit: MaterialKit;
  lamps: boolean;
}) {
  const ground = useMemo(() => mergeByColor(islandPieces(island)), [island]);
  const structure = useMemo(() => {
    if (island.kind === 'porto') return mergeByColor(portoPieces());
    if (island.kind === 'next') return mergeByColor(nextPieces());
    return island.landmark ? mergeByColor(landmarkPieces(island.landmark)) : [];
  }, [island]);
  useEffect(
    () => () => {
      for (const p of [...ground, ...structure]) p.geometry.dispose();
    },
    [ground, structure],
  );

  const rotation = facing(island);
  const landmarkAt = island.kind === 'project' ? -island.radius * 0.42 : 0;
  return (
    <group position={[island.center.x, 0, island.center.z]}>
      <Pieces pieces={ground} kit={kit} lamps={lamps} />
      <group
        rotation={[0, rotation, 0]}
        position={[island.front.x * landmarkAt, 0, island.front.z * landmarkAt]}
      >
        <Pieces pieces={structure} kit={kit} lamps={lamps} />
        {island.landmark === 'windmill' && <Windmill kit={kit} />}
      </group>
      {island.kind === 'project' && (
        <group
          rotation={[0, rotation, 0]}
          position={[
            island.front.x * island.radius * 0.55,
            0,
            island.front.z * island.radius * 0.55,
          ]}
        >
          <Totem project={project} kit={kit} />
        </group>
      )}
      {island.kind === 'next' && lamps && (
        <pointLight position={[0, 2, 0]} color={palette.sun} intensity={6} distance={9} />
      )}
    </group>
  );
}

function Instances({
  geometry,
  color,
  matrices,
  kit,
}: {
  geometry: () => import('three').BufferGeometry;
  color: PaletteName;
  matrices: Matrix4[];
  kit: MaterialKit;
}) {
  const ref = useRef<InstancedMesh>(null);
  const shape = useMemo(() => geometry(), [geometry]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => {
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  useEffect(
    () => () => {
      shape.dispose();
    },
    [shape],
  );
  if (matrices.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[shape, kit.get(color), matrices.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

function Water({ color, frozen }: { color: PaletteName; frozen: boolean }) {
  const timeRef = useRef({ value: 0 });
  const geometry = useMemo(() => new PlaneGeometry(600, 600, 120, 120), []);
  const material = useMemo(() => {
    // Faceted waves: flat shading gives each wave triangle one tone before quantization.
    const m = new MeshLambertMaterial({ color: palette[color], flatShading: true });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeRef.current;
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         transformed.z += sin(position.x * 0.32 + uTime) * 0.12 + cos(position.y * 0.27 + uTime * 0.8) * 0.1;`,
      );
    };
    return m;
  }, [color]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useFrame((_, delta) => {
    if (!frozen) timeRef.current.value += delta;
  });
  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[60, WATER_LEVEL, 0]}
      receiveShadow
    />
  );
}

export function World({
  layout,
  projects,
  kit,
  time,
  reducedMotion,
  shadows,
}: {
  layout: WorldLayout;
  projects: ProjectSummary[];
  kit: MaterialKit;
  time: TimeOfDay;
  reducedMotion: boolean;
  shadows: boolean;
}) {
  const light = LIGHTING[time];
  const bySlug = useMemo(() => new Map(projects.map((p) => [p.slug, p])), [projects]);

  const shallows = useMemo(() => {
    const lagoon = mergeGeometries(
      layout.islands.map((i) =>
        new CircleGeometry(i.radius + 3.2, 20)
          .rotateX(-Math.PI / 2)
          .translate(i.center.x, WATER_LEVEL + 0.06, i.center.z),
      ),
    );
    const foam = mergeGeometries(
      layout.islands.map((i) =>
        new RingGeometry(i.radius + 1.3, i.radius + 1.75, 20)
          .rotateX(-Math.PI / 2)
          .translate(i.center.x, WATER_LEVEL + 0.08, i.center.z),
      ),
    );
    return { lagoon, foam };
  }, [layout]);

  const matrices = useMemo(() => {
    const trees: Matrix4[] = [];
    const rocks: Matrix4[] = [];
    for (const prop of layout.props) {
      const m = new Matrix4().compose(
        new Vector3(prop.position.x, 0, prop.position.z),
        new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), prop.position.x * 1.7),
        new Vector3(prop.size, prop.size, prop.size),
      );
      (prop.kind === 'tree' ? trees : rocks).push(m);
    }
    const planks: Matrix4[] = [];
    for (const bridge of layout.bridges) {
      const dx = bridge.b.x - bridge.a.x;
      const dz = bridge.b.z - bridge.a.z;
      const length = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const count = Math.floor(length / 0.5);
      for (let k = 0; k <= count; k++) {
        const t = k / count;
        planks.push(
          new Matrix4().compose(
            new Vector3(bridge.a.x + dx * t, -0.06, bridge.a.z + dz * t),
            new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), angle),
            new Vector3(1, 1, 1),
          ),
        );
      }
    }
    return { trees, rocks, planks };
  }, [layout]);

  useEffect(
    () => () => {
      shallows.lagoon.dispose();
      shallows.foam.dispose();
    },
    [shallows],
  );

  // One sun for the whole archipelago; its shadow camera covers the route.
  const bounds = useMemo(() => {
    const xs = layout.islands.map((i) => i.center.x);
    const zs = layout.islands.map((i) => i.center.z);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const half = (Math.max(...xs) - Math.min(...xs)) / 2 + 12;
    return { cx, cz, half };
  }, [layout]);

  return (
    <>
      <color attach="background" args={[palette[light.sky]]} />
      <hemisphereLight args={[palette[light.sky], palette[light.water], light.ambient]} />
      <directionalLight
        color={palette[light.sun]}
        intensity={light.sunIntensity}
        position={[bounds.cx - 30, 40, bounds.cz + 25]}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-bounds.half}
        shadow-camera-right={bounds.half}
        shadow-camera-top={bounds.half}
        shadow-camera-bottom={-bounds.half}
        shadow-camera-near={1}
        shadow-camera-far={140}
      >
        <object3D attach="target" position={[bounds.cx, 0, bounds.cz]} />
      </directionalLight>
      <Water color={light.water} frozen={reducedMotion} />
      <mesh geometry={shallows.lagoon} material={kit.get('lagoon')} receiveShadow />
      <mesh geometry={shallows.foam} material={kit.get('foam')} />
      {layout.islands.map((island) => (
        <Island
          key={island.id}
          island={island}
          project={island.slug ? bySlug.get(island.slug) : undefined}
          kit={kit}
          lamps={light.lamps}
        />
      ))}
      <Instances geometry={treeGeometry.trunk} color="olive" matrices={matrices.trees} kit={kit} />
      <Instances geometry={treeGeometry.crown} color="olive" matrices={matrices.trees} kit={kit} />
      <Instances geometry={rockGeometry} color="fog" matrices={matrices.rocks} kit={kit} />
      <Instances geometry={plankGeometry} color="sand" matrices={matrices.planks} kit={kit} />
    </>
  );
}

const plankGeometry = () => new BoxGeometry(1.7, 0.12, 0.36);
