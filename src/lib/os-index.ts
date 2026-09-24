import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import type { Lang } from '@/i18n';
import type { OsIndex } from '@/os/types';
import { testimonials } from './content';
import { getLocalExperience, getLocalProjects, localProfile } from './localize';
import { paths } from './paths';
import { albumsFor } from './photos';

async function image(src: ImageMetadata, width: number) {
  const out = await getImage({ src, width, format: 'webp' });
  return { src: out.src, width, height: Math.round((src.height / src.width) * width) };
}

/**
 * Everything the OS needs at boot, in one language (PROMPT.md §3.4). Pages embed both, so
 * switching language in the system is instant; heavy details load on demand per language.
 */
export async function buildOsIndex(lang: Lang): Promise<OsIndex> {
  const projects = await getLocalProjects(lang);
  const experience = await getLocalExperience(lang);
  return {
    lang,
    profile: localProfile(lang),
    projects: await Promise.all(
      projects.map(async ({ id, data }) => ({
        slug: id,
        title: data.title,
        tagline: data.tagline,
        summary: data.summary,
        year: data.year,
        role: data.role,
        ...(data.client ? { client: data.client } : {}),
        ...(data.duration ? { duration: data.duration } : {}),
        ...(data.team ? { team: data.team } : {}),
        status: data.status,
        stack: data.stack,
        problem: data.problem,
        approach: data.approach,
        outcomes: data.outcomes.map((o) => ({
          value: o.value,
          label: o.label,
          ...(o.source ? { source: o.source } : {}),
        })),
        cover: { ...(await image(data.cover, 640)), alt: data.coverAlt },
        gallery: await Promise.all(
          data.gallery.map(async (g) => ({
            ...(await image(g.src, 960)),
            alt: g.alt,
            ...(g.caption ? { caption: g.caption } : {}),
          })),
        ),
        links: {
          ...(data.links.live ? { live: data.links.live } : {}),
          ...(data.links.repo ? { repo: data.links.repo } : {}),
        },
        demo: data.demo,
        island: {
          biome: data.island.biome,
          landmark: data.island.landmark,
          ...(data.island.seed === undefined ? {} : { seed: data.island.seed }),
        },
        order: data.order,
        featured: data.featured,
      })),
    ),
    albums: albumsFor(lang).map((a) => ({ id: a.id, title: a.title, count: a.photos.length })),
    experience: experience.map(({ id, data }) => ({ id, ...data })),
    testimonials,
    classicUrl: paths.classic(lang),
  };
}
