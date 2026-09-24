import type { Lang } from '@/i18n';

/**
 * Every page and data URL in both languages. Italian keeps the root, English lives under /en
 * with English path names. Shared by the static pages and the OS, so links never disagree.
 */
export const paths = {
  home: (lang: Lang) => (lang === 'en' ? '/en' : '/'),
  classic: (lang: Lang) => (lang === 'en' ? '/en/classic' : '/classica'),
  project: (lang: Lang, slug: string) =>
    `${lang === 'en' ? '/en/projects' : '/progetti'}/${encodeURIComponent(slug)}`,
  projectData: (lang: Lang, slug: string) =>
    `${lang === 'en' ? '/data/en' : '/data'}/projects/${encodeURIComponent(slug)}.json`,
  photosData: (lang: Lang) => (lang === 'en' ? '/data/en/photos.json' : '/data/photos.json'),
};

/** The same page in the other language, for hreflang and the language links. */
export function alternates(page: (lang: Lang) => string): Record<Lang, string> {
  return { it: page('it'), en: page('en') };
}
