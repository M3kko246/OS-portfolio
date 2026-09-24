import type { APIRoute, ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { getProjects } from '@/lib/content';
import { albums } from '@/lib/photos';

/**
 * Every photo in three sizes: a tiny one shown scaled up with pixelated rendering while the real
 * one loads, a grid size and a full size. Optimized copies carry no EXIF data.
 */
async function variants(id: string, src: ImageMetadata, alt: string, caption: string | undefined) {
  const [tiny, medium, full] = await Promise.all([
    getImage({ src, width: 24, format: 'png' }),
    getImage({ src, width: 480, format: 'webp' }),
    getImage({ src, width: 1600, format: 'webp' }),
  ]);
  return {
    id,
    alt,
    ...(caption ? { caption } : {}),
    width: src.width,
    height: src.height,
    tiny: tiny.src,
    medium: medium.src,
    full: full.src,
  };
}

export const GET = (async () => {
  const projects = await getProjects();
  const payload = {
    albums: [
      ...(await Promise.all(
        albums.map(async (album) => ({
          id: album.id,
          title: album.title,
          photos: await Promise.all(
            album.photos.map((p) => variants(p.id, p.image, p.alt, p.caption)),
          ),
        })),
      )),
      ...(await Promise.all(
        projects
          .filter((p) => p.data.gallery.length > 0)
          .map(async (p) => ({
            id: `progetto-${p.id}`,
            project: p.id,
            title: p.data.title,
            photos: await Promise.all(
              p.data.gallery.map((g, i) => variants(`${p.id}/${i}`, g.src, g.alt, g.caption)),
            ),
          })),
      )),
    ],
  };
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
}) satisfies APIRoute;
