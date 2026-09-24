import { getCollection, type CollectionEntry } from 'astro:content';
import { profile, type LocalProfile } from '@/data/profile';
import type { Lang } from '@/i18n';
import { getExperience, getProjects, type Project } from './content';

/**
 * Content in the page's language (PROMPT.md §3.11). Italian is complete; English fields are
 * optional and each missing one falls back to Italian, so a page is never empty.
 */
export type ProjectEn = CollectionEntry<'projectsEn'>;

export interface LocalProject {
  id: string;
  data: Project['data'];
  /** Language of the project's texts: `it` when an English page has no translation for it. */
  lang: Lang;
  /** The entry whose Markdown body is the case study to show. */
  body: Project | ProjectEn;
}

export async function getLocalProjects(lang: Lang): Promise<LocalProject[]> {
  const projects = await getProjects();
  const english = lang === 'en' ? await getCollection('projectsEn') : [];
  return projects.map((entry) => {
    const en = english.find((e) => e.id === entry.id);
    if (!en) return { id: entry.id, data: entry.data, lang: 'it', body: entry };
    const d = en.data;
    const base = entry.data;
    const data: Project['data'] = {
      ...base,
      title: d.title ?? base.title,
      tagline: d.tagline ?? base.tagline,
      summary: d.summary ?? base.summary,
      role: d.role ?? base.role,
      problem: d.problem ?? base.problem,
      approach: d.approach ?? base.approach,
      outcomes: d.outcomes ?? base.outcomes,
      coverAlt: d.coverAlt ?? base.coverAlt,
      gallery: base.gallery.map((g, i) => {
        const alt = d.gallery?.[i]?.alt ?? g.alt;
        const caption = d.gallery?.[i]?.caption ?? g.caption;
        return { src: g.src, alt, ...(caption === undefined ? {} : { caption }) };
      }),
    };
    const client = d.client ?? base.client;
    const duration = d.duration ?? base.duration;
    const team = d.team ?? base.team;
    if (client !== undefined) data.client = client;
    if (duration !== undefined) data.duration = duration;
    if (team !== undefined) data.team = team;
    return {
      id: entry.id,
      data,
      lang: 'en',
      body: en.body?.trim() ? en : entry,
    };
  });
}

/** Portfolio order: newest first. The game keeps route order. */
export function newestFirst(projects: LocalProject[]): LocalProject[] {
  return [...projects].sort((a, b) => b.data.year - a.data.year || b.data.order - a.data.order);
}

export function localProfile(lang: Lang): LocalProfile {
  const { en, ...base } = profile;
  if (lang === 'it' || !en) return base;
  return {
    ...base,
    role: en.role ?? base.role,
    bioShort: en.bioShort ?? base.bioShort,
    bioLong: en.bioLong ?? base.bioLong,
    availability: { ...base.availability, label: en.availability ?? base.availability.label },
    languages: en.languages ?? base.languages,
    skills: en.skills ?? base.skills,
  };
}

/** The CV in the page's language, when there is an English one. */
export function cvUrl(lang: Lang): string {
  return lang === 'en' ? (profile.cv.en ?? profile.cv.it) : profile.cv.it;
}

export type Experience = Awaited<ReturnType<typeof getExperience>>[number];

export async function getLocalExperience(lang: Lang) {
  const entries = await getExperience();
  return entries.map(({ id, data }) => {
    const { en, ...base } = data;
    if (lang === 'it' || !en) return { id, data: base };
    return {
      id,
      data: {
        ...base,
        title: en.title ?? base.title,
        description: en.description ?? base.description,
      },
    };
  });
}

/** "Name, Role", or "Page, Name" for inner pages. */
export function pageTitle(lang: Lang, prefix?: string): string {
  const p = localProfile(lang);
  return prefix ? `${prefix}, ${p.name}` : `${p.name}, ${p.role}`;
}

export function personJsonLd(lang: Lang, site: URL) {
  const p = localProfile(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    jobTitle: p.role,
    url: site.href,
    email: `mailto:${p.email}`,
    sameAs: p.socials.map((s) => s.url),
    knowsLanguage: p.languages.map((l) => l.name),
  };
}
