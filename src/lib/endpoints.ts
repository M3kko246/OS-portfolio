import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import type { Lang } from '@/i18n';
import { getLocalProjects, localProfile, type LocalProject } from './localize';
import { renderOgPng } from './og';
import { albumsFor } from './photos';

/**
 * Shared bodies of the per-language static endpoints: the Italian ones live at the root, the
 * English ones under /en or /data/en.
 */
const json = (payload: unknown) =>
  new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
const png = (bytes: Uint8Array<ArrayBuffer>) =>
  new Response(bytes, { headers: { 'Content-Type': 'image/png' } });

/** Case study HTML for the Reader, rendered at build time from the project's Markdown body. */
export function caseStudy(project: LocalProject): Response {
  return json({
    slug: project.id,
    title: project.data.title,
    lang: project.lang,
    html: project.body.rendered?.html ?? '',
  });
}

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

export async function photos(lang: Lang): Promise<Response> {
  const projects = await getLocalProjects(lang);
  return json({
    albums: [
      ...(await Promise.all(
        albumsFor(lang).map(async (album) => ({
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
  });
}

export async function homeImage(lang: Lang): Promise<Response> {
  const profile = localProfile(lang);
  return png(
    await renderOgPng({
      window: profile.osName,
      title: profile.name,
      subtitle: profile.bioShort,
      footer: profile.role,
    }),
  );
}

export async function projectImage(lang: Lang, project: LocalProject): Promise<Response> {
  const profile = localProfile(lang);
  return png(
    await renderOgPng({
      window: `${profile.osName} / ${lang === 'en' ? 'projects' : 'progetti'}`,
      title: project.data.title,
      subtitle: project.data.tagline,
      accent: `${String(project.data.year)} · ${project.data.stack.slice(0, 3).join(' · ')}`,
      footer: `${profile.name} · ${profile.role}`,
    }),
  );
}
