import type { OsIndex, ProjectSummary } from '@/os/types';

export function project(
  slug: string,
  order: number,
  extra: Partial<ProjectSummary> = {},
): ProjectSummary {
  return {
    slug,
    title: `Progetto ${slug}`,
    tagline: 'Tagline',
    summary: 'Sintesi',
    year: 2020 + order,
    role: 'Ruolo',
    status: 'live',
    stack: ['Astro'],
    problem: 'Problema',
    approach: 'Approccio',
    outcomes: [],
    cover: { src: '/cover.png', width: 1280, height: 800, alt: 'Copertina' },
    gallery: [],
    links: {},
    demo: { kind: 'none' },
    island: { biome: 'meadow', landmark: 'lighthouse' },
    order,
    featured: false,
    ...extra,
  };
}

export const osIndex: OsIndex = {
  lang: 'it',
  profile: {
    name: 'Nome Cognome',
    firstName: 'Nome',
    osName: 'NomeOS',
    initials: 'NC',
    role: 'Ruolo',
    bioShort: 'Bio',
    bioLong: 'Bio lunga',
    availability: { available: true, label: 'Disponibile' },
    email: 'nome@example.com',
    languages: [{ name: 'Italiano', level: 'Madrelingua' }],
    socials: [],
    cv: { it: '/cv/CV.pdf' },
    skills: [{ area: 'Area', items: ['Uno'] }],
  },
  projects: [
    project('beta', 2, {
      demo: { kind: 'external', url: 'https://example.com' },
      links: { repo: 'https://example.com/r' },
    }),
    project('alfa', 1),
  ],
  albums: [{ id: 'viaggi', title: 'Viaggi', count: 3 }],
  experience: [],
  testimonials: [],
  classicUrl: '/classica',
};
