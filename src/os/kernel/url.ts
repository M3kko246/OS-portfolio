import { isAppId, type AppId, type AppParams } from '@/os/apps/ids';

export interface Intent {
  appId: AppId;
  params: AppParams;
}

/**
 * Deep links: `?app=<id>`, `?progetto=<slug>`, `?app=career&isola=<slug>`.
 * Unknown apps and projects are ignored rather than opening an empty window.
 */
export function parseSearch(search: string, projectSlugs: ReadonlySet<string>): Intent | null {
  const query = new URLSearchParams(search);
  const project = query.get('progetto');
  if (project !== null) {
    return projectSlugs.has(project) ? { appId: 'project', params: { slug: project } } : null;
  }
  const app = query.get('app');
  if (app === null || !isAppId(app) || app === 'project') return null;
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
  return `?${query.toString()}`;
}

/** Link shared by `Copia link`: the static page, which carries the social preview. */
export function projectPageUrl(origin: string, slug: string): string {
  return new URL(`/progetti/${encodeURIComponent(slug)}`, origin).href;
}
