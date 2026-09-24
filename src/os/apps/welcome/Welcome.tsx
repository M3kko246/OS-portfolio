import { useSyncExternalStore } from 'react';
import { useOsIndex } from '@/os/context';
import { openApp } from '@/os/kernel/launcher';
import { useSession, sessionStore } from '@/os/kernel/session';
import { shortcutLabel, useT } from '@/os/lib/i18n';
import { BrandMark } from '@/os/ui/primitives';

const COARSE = '(pointer: coarse)';
const subscribe = (listener: () => void) => {
  const query = window.matchMedia(COARSE);
  query.addEventListener('change', listener);
  return () => {
    query.removeEventListener('change', listener);
  };
};

export default function Welcome() {
  const t = useT();
  const { profile } = useOsIndex();
  const showOnStartup = useSession((s) => s.showWelcome);
  const touch = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(COARSE).matches,
    () => false,
  );

  return (
    <div className="app-welcome">
      <div className="welcome-id">
        {/* Placeholder avatar: the owner's photo arrives with the content (CONTENT_TODO.md). */}
        <BrandMark className="brand-mark-4" />
        <div className="flex flex-col gap-2">
          <h3 className="text-read-lg font-bold">
            {t('welcome.hello', { name: profile.firstName })}
          </h3>
          <p className="text-read">{profile.role}</p>
        </div>
      </div>
      <p className="text-read">{profile.bioShort}</p>
      <p className="welcome-actions">
        <button
          type="button"
          className="px-btn px-btn-primary"
          data-autofocus
          onClick={(e) => {
            openApp('career', {}, e.currentTarget);
          }}
        >
          {t('action.startCareer')}
        </button>
        <a className="px-btn" href={profile.cv.it} download>
          {t('action.downloadCv')}
        </a>
        <button
          type="button"
          className="px-btn"
          onClick={(e) => {
            openApp('mail', {}, e.currentTarget);
          }}
        >
          {t('action.contactMe')}
        </button>
      </p>
      <p className="welcome-hint font-pixel text-ui">
        {touch ? t('welcome.hintTouch') : t('welcome.hint', { shortcut: shortcutLabel('K') })}
      </p>
      <label className="checkbox font-pixel text-ui">
        <input
          type="checkbox"
          checked={showOnStartup}
          onChange={(e) => {
            sessionStore.getState().setShowWelcome(e.target.checked);
          }}
        />
        {t('welcome.showOnStartup')}
      </label>
    </div>
  );
}
