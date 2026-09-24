import './project.css';
import { useState } from 'react';
import type { MessageKey } from '@/i18n';
import { useOsIndex } from '@/os/context';
import type { AppProps } from '@/os/apps/manifest';
import { openApp, openExternal } from '@/os/kernel/launcher';
import { projectPageUrl } from '@/os/kernel/url';
import { useT } from '@/os/lib/i18n';
import { ErrorState } from '@/os/ui/States';

export default function Project({ params }: AppProps) {
  const t = useT();
  const { projects, lang } = useOsIndex();
  const project = projects.find((p) => p.slug === params.slug);
  const [copyStatus, setCopyStatus] = useState('');

  if (!project) {
    return (
      <ErrorState message={t('project.notFound')}>
        <button
          type="button"
          className="px-btn"
          onClick={() => {
            openApp('explorer');
          }}
        >
          {t('app.explorer')}
        </button>
      </ErrorState>
    );
  }

  const facts: [MessageKey, string | undefined][] = [
    ['project.year', String(project.year)],
    ['project.role', project.role],
    ['project.client', project.client],
    ['project.duration', project.duration],
    ['project.team', project.team],
    ['project.status', t(`status.${project.status}`)],
  ];
  const hasDemo = project.demo.kind !== 'none';
  const { repo } = project.links;

  const copyLink = () => {
    const url = projectPageUrl(window.location.origin, project.slug, lang);
    navigator.clipboard.writeText(url).then(
      () => {
        setCopyStatus(t('project.linkCopied'));
      },
      () => {
        setCopyStatus(t('project.copyFailed', { url }));
      },
    );
  };

  return (
    <article className="app-project" aria-labelledby={`project-${project.slug}`}>
      <img
        className="project-cover"
        src={project.cover.src}
        width={project.cover.width}
        height={project.cover.height}
        alt={project.cover.alt}
      />
      <header className="project-head">
        <h3 id={`project-${project.slug}`} className="text-read-lg font-bold">
          {project.title}
        </h3>
        <p>{project.tagline}</p>
      </header>

      <div className="project-actions">
        {hasDemo && (
          <button
            type="button"
            className="px-btn px-btn-primary"
            onClick={(e) => {
              openApp('demo', { slug: project.slug }, e.currentTarget);
            }}
          >
            {t('action.tryDemo')}
          </button>
        )}
        <button
          type="button"
          className={hasDemo ? 'px-btn' : 'px-btn px-btn-primary'}
          onClick={(e) => {
            openApp('reader', { slug: project.slug }, e.currentTarget);
          }}
        >
          {t('action.readCaseStudy')}
        </button>
        <button
          type="button"
          className="px-btn"
          onClick={(e) => {
            openApp('career', { island: project.slug }, e.currentTarget);
          }}
        >
          {t('action.visitIsland')}
        </button>
        {repo && (
          <button
            type="button"
            className="px-btn"
            onClick={() => {
              openExternal(repo);
            }}
          >
            {t('action.code')}
          </button>
        )}
        <button type="button" className="px-btn" onClick={copyLink}>
          {t('action.copyLink')}
        </button>
        <p className="project-copy-status" role="status">
          {copyStatus}
        </p>
      </div>

      <dl className="project-facts">
        {facts
          .filter((fact): fact is [MessageKey, string] => fact[1] !== undefined)
          .map(([key, value]) => (
            <div key={key}>
              <dt>{t(key)}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      <ul className="tags" aria-label={t('project.stack')}>
        {project.stack.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <section>
        <h4 className="font-bold">{t('project.problem')}</h4>
        <p>{project.problem}</p>
      </section>
      <section>
        <h4 className="font-bold">{t('project.approach')}</h4>
        <p>{project.approach}</p>
      </section>
      {project.outcomes.length > 0 && (
        <section>
          <h4 className="font-bold">{t('project.outcomes')}</h4>
          <ul className="project-outcomes">
            {project.outcomes.map((o) => (
              <li key={o.label}>
                <strong>{o.value}</strong> {o.label}
                {o.source && <span> ({t('project.source', { source: o.source })})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {project.gallery.length > 0 && (
        <section>
          <h4 className="font-bold">{t('project.gallery')}</h4>
          <ul className="project-gallery">
            {project.gallery.map((image) => (
              <li key={image.src}>
                <button
                  type="button"
                  className="project-thumb"
                  onClick={(e) => {
                    openApp('photos', { project: project.slug }, e.currentTarget);
                  }}
                >
                  <img src={image.src} width={image.width} height={image.height} alt={image.alt} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
