import type { Lang } from '@/i18n';
import { paths } from '@/lib/paths';
import { isAppId, type AppId, type AppParams } from '@/os/apps/ids';

export interface Intent {
  appId: AppId;
  params: AppParams;
}

/** Apps that show one project: their links carry it, or they are not opened at all. */
const PER_PROJECT = new Set<AppId>(['project', 'reader', 'demo']);

/**
 * Deep links: `?app=<id>`, `?progetto=<slug>` (the project card),
 * `?app=reader&progetto=<slug>` and `?app=demo&progetto=<slug>`, `?app=career&isola=<slug>`.
 * Unknown apps and projects are ignored rather than opening an empty window.
 */
export function parseSearch(search: string, projectSlugs: ReadonlySet<string>): Intent | null {
  const query = new URLSearchParams(search);
  const app = query.get('app');
  const project = query.get('progetto');
  if (project !== null) {
    if (!projectSlugs.has(project)) return null;
    const appId: AppId = app === 'reader' || app === 'demo' ? app : 'project';
    return { appId, params: { slug: project } };
  }
  if (app === null || !isAppId(app) || PER_PROJECT.has(app)) return null;
  const island = query.get('isola');
  if (app === 'career' && island !== null && projectSlugs.has(island)) {
    return { appId: 'career', params: { island } };
  }
  return { appId: app, params: {} };
}

/** The shareable query for a window, or '' for the bare desktop. */
export function searchFor(intent: Intent | null): string {
  if (!intent) return '';
  if (intent.appId === 'project' && intent.params.slug) {
    return `?progetto=${encodeURIComponent(intent.params.slug)}`;
  }
  const query = new URLSearchParams({ app: intent.appId });
  if (intent.appId === 'career' && intent.params.island) query.set('isola', intent.params.island);
  if ((intent.appId === 'reader' || intent.appId === 'demo') && intent.params.slug) {
    query.set('progetto', intent.params.slug);
  }
  return `?${query.toString()}`;
}

/** Link shared by `Copia link`: the static page, which carries the social preview. */
export function projectPageUrl(origin: string, slug: string, lang: Lang = 'it'): string {
  return new URL(paths.project(lang, slug), origin).href;
}
