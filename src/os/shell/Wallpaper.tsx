import { useEffect, useRef, useSyncExternalStore } from 'react';
import lightUrl from '@/assets/wallpapers/light.png?url';
import tileUrl from '@/assets/wallpapers/drafts-tile.png?url';
import wallpapers from '@/assets/wallpapers/wallpapers.json';
import { subscribeTimeOfDay, timeOfDay, type TimeOfDay } from '@/design/time';
import { useSession } from '@/os/kernel/session';
import { useSettings, type WallpaperId } from '@/os/kernel/settings';

/**
 * The desktop wallpaper: the archipelago of Carriera rendered from the game world
 * (scripts/render-wallpapers.ts), one image per time of day. It is shown whole, at the largest
 * whole-number scale in device pixels, so every art pixel stays square and sharp; the space
 * around it takes the colour of its open sea, the same colour as the image border.
 * At night the islands already visited have a light on.
 *
 * It is drawn on a canvas at its own 480x270 and enlarged by CSS: lights land on exact art
 * pixels, and a decorative canvas is never the page's Largest Contentful Paint (the boot
 * screen with name and role is).
 */
const art = import.meta.glob<string>('/src/assets/wallpapers/{dawn,day,dusk,night}.png', {
  eager: true,
  // Emitted as files, never inlined: only the wallpaper on screen is downloaded.
  query: '?no-inline',
  import: 'default',
});
const LIGHT_SIZE = 5;
const lights: Partial<Record<string, readonly number[]>> = wallpapers.lights;

function subscribeViewport(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
  };
}
const viewportKey = () =>
  `${String(window.innerWidth)} ${String(window.innerHeight)} ${String(window.devicePixelRatio)}`;
const currentTime = () => timeOfDay();
const serverTime = (): TimeOfDay => 'day';

async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

/** The wallpaper actually shown: `auto` follows the visitor's local time. */
export function useEffectiveWallpaper(): Exclude<WallpaperId, 'auto'> {
  const setting = useSettings((s) => s.wallpaper);
  const time = useSyncExternalStore(subscribeTimeOfDay, currentTime, serverTime);
  return setting === 'auto' ? time : setting;
}

function ArtCanvas({
  time,
  lit,
  fit,
}: {
  time: TimeOfDay;
  lit: readonly string[];
  fit: 'contain' | 'cover';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewport = useSyncExternalStore(subscribeViewport, viewportKey, () => '');
  const { width, height } = wallpapers;
  const glowing = time === 'night' ? lit.filter((slug) => lights[slug]) : [];
  // Compared by content: a new array with the same islands must not redraw.
  const glowKey = glowing.join(' ');

  useEffect(() => {
    let cancelled = false;
    const slugs = glowKey === '' ? [] : glowKey.split(' ');
    const draw = async () => {
      const [image, light] = await Promise.all([
        loadImage(art[`/src/assets/wallpapers/${time}.png`] ?? ''),
        slugs.length > 0 ? loadImage(lightUrl) : null,
      ]);
      const context = canvasRef.current?.getContext('2d');
      if (cancelled || !context) return;
      context.drawImage(image, 0, 0);
      const half = Math.floor(LIGHT_SIZE / 2);
      for (const slug of slugs) {
        const [x = 0, y = 0] = lights[slug] ?? [];
        if (light) context.drawImage(light, x - half, y - half);
      }
    };
    // Without the image the sea colour around it still shows: nothing else to do.
    draw().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [time, glowKey]);

  const [w = 0, h = 0, dpr = 1] = viewport.split(' ').map(Number);
  const deviceW = w * dpr;
  const deviceH = h * dpr;
  const scale = Math.max(
    1,
    fit === 'cover'
      ? Math.ceil(Math.max(deviceW / width, deviceH / height))
      : Math.floor(Math.min(deviceW / width, deviceH / height)),
  );
  const left = Math.round((deviceW - width * scale) / 2) / dpr;
  const top = Math.round((deviceH - height * scale) / 2) / dpr;

  return (
    <canvas
      ref={canvasRef}
      className="wallpaper-canvas"
      width={width}
      height={height}
      data-wallpaper={time}
      data-lights={glowing.length}
      style={{
        width: (width * scale) / dpr,
        height: (height * scale) / dpr,
        transform: `translate(${String(left)}px, ${String(top)}px)`,
      }}
    />
  );
}

/** `cover` fills a phone screen, cropping the sides; `contain` shows the whole archipelago. */
export function Wallpaper({ fit = 'contain' }: { fit?: 'contain' | 'cover' }) {
  const wallpaper = useEffectiveWallpaper();
  const visited = useSession((s) => s.visitedIslands);

  if (wallpaper === 'drafts') {
    return (
      <div
        className="wallpaper wallpaper-tile"
        aria-hidden="true"
        style={{ backgroundImage: `url(${tileUrl})` }}
      />
    );
  }
  if (wallpaper === 'solid-night' || wallpaper === 'solid-chalk') return null;
  return (
    <div
      className="wallpaper"
      aria-hidden="true"
      style={{ backgroundColor: wallpapers.sea[wallpaper] }}
    >
      <ArtCanvas time={wallpaper} lit={visited} fit={fit} />
    </div>
  );
}
