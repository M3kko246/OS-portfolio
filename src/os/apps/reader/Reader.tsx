import { paths } from '@/lib/paths';
import type { AppProps } from '@/os/apps/manifest';
import { useOsIndex } from '@/os/context';
import { useT } from '@/os/lib/i18n';
import { useResource } from '@/os/lib/resource';
import { Skeleton } from '@/os/ui/Skeleton';
import { EmptyState, ErrorState } from '@/os/ui/States';

interface CaseStudy {
  slug: string;
  title: string;
  html: string;
}

export default function Reader({ params }: AppProps) {
  const t = useT();
  const slug = params.slug ?? '';
  const { lang } = useOsIndex();
  const resource = useResource<CaseStudy>(paths.projectData(lang, slug));
  const page = paths.project(lang, slug);

  if (resource.status === 'loading') {
    return <Skeleton shape="document" label={t('app.loading', { title: t('app.reader') })} />;
  }
  if (resource.status === 'error') {
    return (
      <ErrorState message={t('reader.error')} retry={resource.retry}>
        <a className="px-btn" href={page}>
          {t('reader.openPage')}
        </a>
      </ErrorState>
    );
  }
  if (!resource.data.html.trim()) return <EmptyState message={t('reader.empty')} />;

  return (
    <div className="app-reader">
      <h3 className="text-read-xl font-bold">{resource.data.title}</h3>
      {/*
        The only raw HTML in the system: it comes from the project's own Markdown
        (src/content/projects), rendered at build time into /data/projects/[slug].json.
        No visitor input ever reaches it.
      */}
      {/* eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: resource.data.html }} />
      <p>
        <a className="reader-link" href={page}>
          {t('reader.openPage')}
        </a>
      </p>
    </div>
  );
}
