import '../apps.css';
import { Download } from 'pixelarticons/react/Download';
import { useState, useSyncExternalStore } from 'react';
import { useOsIndex } from '@/os/context';
import { useT } from '@/os/lib/i18n';
import { Skeleton } from '@/os/ui/Skeleton';
import { cx, Glyph } from '@/os/ui/primitives';

const PHONE = '(max-width: 767px), (pointer: coarse) and (max-width: 1023px)';
const subscribe = (listener: () => void) => {
  const query = window.matchMedia(PHONE);
  query.addEventListener('change', listener);
  return () => {
    query.removeEventListener('change', listener);
  };
};

/** The browser's own PDF viewer on desktop; a straight download on phones. */
export default function Cv() {
  const t = useT();
  const { profile } = useOsIndex();
  const [loaded, setLoaded] = useState(false);
  const phone = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );

  const download = (
    <a className="px-btn px-btn-primary" href={profile.cv.it} download>
      <Glyph icon={Download} />
      {t('action.downloadCv')}
    </a>
  );

  if (phone) {
    return (
      <div className="app-state">
        <p className="text-read">{t('cv.mobile')}</p>
        <p>{download}</p>
      </div>
    );
  }

  return (
    <div className="app-cv">
      <div className="cv-bar">
        {download}
        <span className="cv-note">{t('cv.fallback')}</span>
      </div>
      <div className="cv-frame-wrap">
        {!loaded && <Skeleton shape="document" label={t('app.loading', { title: t('app.cv') })} />}
        <iframe
          className={cx('cv-frame', !loaded && 'is-loading')}
          src={profile.cv.it}
          title={t('cv.frameTitle')}
          onLoad={() => {
            setLoaded(true);
          }}
        />
      </div>
    </div>
  );
}
