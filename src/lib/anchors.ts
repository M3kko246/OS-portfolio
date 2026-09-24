import type { Lang } from '@/i18n';

/** Section anchors of the classic page, readable in each language. */
export const anchors = {
  it: {
    content: 'contenuto',
    about: 'chi-sono',
    projects: 'progetti',
    skills: 'competenze',
    path: 'percorso',
    photos: 'foto',
    testimonials: 'testimonianze',
    contact: 'contatti',
  },
  en: {
    content: 'content',
    about: 'about',
    projects: 'projects',
    skills: 'skills',
    path: 'path',
    photos: 'photos',
    testimonials: 'testimonials',
    contact: 'contact',
  },
} as const satisfies Record<Lang, Record<string, string>>;
