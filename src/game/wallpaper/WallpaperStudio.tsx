import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type Camera, OrthographicCamera, Vector3 } from 'three';
import { timeOfDay, timesOfDay, type TimeOfDay } from '@/design/time';
import { PixelPipeline } from '@/game/fx/PixelPipeline';
import { cameraBasis, cameraOffset, ISO_ELEVATION } from '@/game/logic/camera';
import { layoutKey, layoutWorld, type ProjectInput, type WorldLayout } from '@/game/logic/layout';
import { MaterialKit } from '@/game/world/materials';
import { World } from '@/game/world/World';

/**
 * Dev-only studio (route /dev/wallpaper, see astro.config.mjs) that renders the desktop
 * wallpapers from the game world itself: same islands, same palette, seen from afar at the
 * game's own angle. scripts/render-wallpapers.ts drives it with Playwright and saves the frames.
 */
export const WALLPAPER_WIDTH = 480;
export const WALLPAPER_HEIGHT = 270;

export interface StudioResult {
  key: string;
  /** Art-pixel position of each project island's light, for the night overlay. */
  lights: Record<string, [number, number]>;
}

declare global {
  interface Window {
    __wallpaper?: StudioResult;
  }
}

const YAW = 0;
/** Tallest landmark, so its top never leaves the frame. */
const LANDMARK_HEIGHT = 6;
const MARGIN = 0.84;

/** Frames the whole archipelago at the game's angle, with some open sea around it. */
function frameArchipelago(camera: Camera, layout: WorldLayout): void {
  const { right, up } = cameraBasis(YAW);
  const dot = (v: readonly number[], x: number, y: number, z: number) =>
    (v[0] ?? 0) * x + (v[1] ?? 0) * y + (v[2] ?? 0) * z;
  let minR = Infinity;
  let maxR = -Infinity;
  let minU = Infinity;
  let maxU = -Infinity;
  for (const island of layout.islands) {
    const r = dot(right, island.center.x, 0, island.center.z);
    const u = dot(up, island.center.x, 0, island.center.z);
    // A circle on the ground spans its radius sideways and radius * sin(elevation) upwards;
    // the reach includes the lagoon ring around each island.
    const reach = island.radius + 3.5;
    minR = Math.min(minR, r - reach);
    maxR = Math.max(maxR, r + reach);
    minU = Math.min(minU, u - reach * Math.sin(ISO_ELEVATION));
    maxU = Math.max(
      maxU,
      u + reach * Math.sin(ISO_ELEVATION) + LANDMARK_HEIGHT * Math.cos(ISO_ELEVATION),
    );
  }
  const midR = (minR + maxR) / 2;
  const midU = (minU + maxU) / 2;
  const target = new Vector3(
    right[0] * midR + up[0] * midU,
    right[1] * midR + up[1] * midU,
    right[2] * midR + up[2] * midU,
  );
  const [ox, oy, oz] = cameraOffset(YAW, 120);
  camera.position.set(target.x + ox, target.y + oy, target.z + oz);
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
  // Some open sea around the archipelago, so desktop icons rarely cover an island.
  if (!(camera instanceof OrthographicCamera)) return;
  camera.zoom =
    MARGIN * Math.min(WALLPAPER_WIDTH / (maxR - minR), WALLPAPER_HEIGHT / (maxU - minU));
  camera.updateProjectionMatrix();
}

function Framing({
  layout,
  onReady,
}: {
  layout: WorldLayout;
  onReady: (r: StudioResult['lights']) => void;
}) {
  const camera = useThree((s) => s.camera);
  const framesRef = useRef(0);
  const doneRef = useRef(false);

  useLayoutEffect(() => {
    frameArchipelago(camera, layout);
  }, [camera, layout]);

  // A few frames let shadows and materials settle before the frame is captured.
  useFrame(() => {
    framesRef.current += 1;
    if (doneRef.current || framesRef.current < 8) return;
    doneRef.current = true;
    const lights: StudioResult['lights'] = {};
    for (const island of layout.islands) {
      if (island.kind !== 'project' || !island.slug) continue;
      // The lamp sits on the landmark, behind the island centre, at window height.
      const at = new Vector3(
        island.center.x - island.front.x * island.radius * 0.42,
        2.2,
        island.center.z - island.front.z * island.radius * 0.42,
      ).project(camera);
      lights[island.slug] = [
        Math.round(((at.x + 1) / 2) * WALLPAPER_WIDTH),
        Math.round(((1 - at.y) / 2) * WALLPAPER_HEIGHT),
      ];
    }
    onReady(lights);
  }, 2);

  return null;
}

export default function WallpaperStudio({ projects }: { projects: ProjectInput[] }) {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('time');
  const time: TimeOfDay = timesOfDay.find((t) => t === requested) ?? timeOfDay();
  const raw = params.get('raw') === '1';
  const layout = useMemo(() => layoutWorld(projects), [projects]);
  const [kit] = useState(() => new MaterialKit());

  const onReady = (lights: StudioResult['lights']) => {
    window.__wallpaper = { key: layoutKey(projects), lights };
    document.documentElement.dataset.ready = '1';
  };

  return (
    <Canvas
      orthographic
      flat
      dpr={1}
      shadows="basic"
      gl={{ antialias: false, preserveDrawingBuffer: true }}
      camera={{ near: 1, far: 400 }}
      style={{ width: WALLPAPER_WIDTH, height: WALLPAPER_HEIGHT }}
    >
      <World
        layout={layout}
        projects={[]}
        kit={kit}
        time={time}
        reducedMotion
        shadows
        {...(time === 'night' ? { lamps: false } : {})}
      />
      <Framing layout={layout} onReady={onReady} />
      {/* No dithering: flat bands stay calm behind the icons. */}
      <PixelPipeline dither={false} pixelSize={1} quantize={!raw} />
    </Canvas>
  );
}
