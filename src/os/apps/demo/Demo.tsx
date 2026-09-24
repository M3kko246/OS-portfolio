import { ExternalLink } from 'pixelarticons/react/ExternalLink';
import { Reload } from 'pixelarticons/react/Reload';
import { useState } from 'react';
import { useOsIndex } from '@/os/context';
import type { AppProps } from '@/os/apps/manifest';
import { openExternal } from '@/os/kernel/launcher';
import { useT } from '@/os/lib/i18n';
import { EmptyState, ErrorState } from '@/os/ui/States';
import { Glyph } from '@/os/ui/primitives';

/** A retro browser frame. Demos are embedded only when the content says they allow it. */
export default function Demo({ params }: AppProps) {
  const t = useT();
  const { projects, profile } = useOsIndex();
  const project = projects.find((p) => p.slug === params.slug);
  const [reloads, setReloads] = useState(0);

  if (!project) return <ErrorState message={t('project.notFound')} />;
  const { demo } = project;
  if (demo.kind === 'none') return <EmptyState message={t('demo.none')} />;

  return (
    <div className="app-demo">
      <div className="demo-bar">
        <label className="demo-address">
          <span className="sr-only">{t('demo.address')}</span>
          <input className="px-field" readOnly value={demo.url} />
        </label>
        {demo.kind === 'embed' && (
          <button
            type="button"
            className="px-btn icon-btn"
            aria-label={t('demo.reload')}
            onClick={() => {
              setReloads((n) => n + 1);
            }}
          >
            <Glyph icon={Reload} />
          </button>
        )}
        <button
          type="button"
          className="px-btn"
          onClick={() => {
            openExternal(demo.url);
          }}
        >
          <Glyph icon={ExternalLink} />
          {t('demo.openTab')}
        </button>
      </div>
      {demo.kind === 'embed' ? (
        <iframe
          key={reloads}
          className="demo-frame"
          src={demo.url}
          title={t('demo.frameTitle', { title: project.title })}
          // Demos always live on another origin (frame-src lists them): allow-same-origin keeps
          // their own storage working without giving them access to this page.
          // eslint-disable-next-line @eslint-react/dom-no-unsafe-iframe-sandbox
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="demo-preview">
          <img
            src={project.cover.src}
            width={project.cover.width}
            height={project.cover.height}
            alt={project.cover.alt}
          />
          <p className="text-read">{t('demo.external', { os: profile.osName })}</p>
        </div>
      )}
    </div>
  );
}
