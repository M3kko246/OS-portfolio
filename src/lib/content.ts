import { getCollection, type CollectionEntry } from 'astro:content';
import { z } from 'astro/zod';
import testimonialsJson from '@/content/testimonials.json';
import { profile } from '@/data/profile';

export type Project = CollectionEntry<'projects'>;
export type Experience = CollectionEntry<'experience'>;

/** Projects in route order (oldest island first). Drafts only exist in development. */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection(
    'projects',
    ({ data }) => !(import.meta.env.PROD && data.draft),
  );
  return projects.sort((a, b) => a.data.order - b.data.order);
}

/** Newest first, for lists that read as a portfolio rather than as a route. */
export async function getProjectsNewestFirst(): Promise<Project[]> {
  return (await getProjects()).sort(
    (a, b) => b.data.year - a.data.year || b.data.order - a.data.order,
  );
}

/** Experience and education in reverse chronological order. */
export async function getExperience(): Promise<Experience[]> {
  const entries = await getCollection('experience');
  return entries.sort((a, b) => b.data.start.localeCompare(a.data.start));
}

const testimonialSchema = z.array(
  z.object({
    // About three lines of text at most (PROMPT.md §0).
    quote: z.string().max(280),
    name: z.string(),
    role: z.string(),
    company: z.string(),
  }),
);

/** Optional and usually empty, so it is a validated JSON file rather than a collection. */
export const testimonials = testimonialSchema.parse(testimonialsJson);

export function pageTitle(prefix?: string): string {
  const base = `${profile.name}, ${profile.role}`;
  return prefix ? `${prefix}, ${profile.name}` : base;
}

export function personJsonLd(site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.role,
    url: site.href,
    email: `mailto:${profile.email}`,
    sameAs: profile.socials.map((s) => s.url),
    knowsLanguage: profile.languages.map((l) => l.name),
  };
}
