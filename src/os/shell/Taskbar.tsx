import { Volume2 } from 'pixelarticons/react/Volume2';
import { VolumeX } from 'pixelarticons/react/VolumeX';
import { useEffect, useState } from 'react';
import { useOsIndex } from '@/os/context';
import { manifests } from '@/os/apps/registry';
import { windowTitle } from '@/os/kernel/launcher';
import { settingsStore, useSettings } from '@/os/kernel/settings';
import { shellStore, useShell } from '@/os/kernel/shell';
import { useWindows, windowStore } from '@/os/kernel/windows';
import { useT } from '@/os/lib/i18n';
import { BrandMark, cx, Glyph } from '@/os/ui/primitives';

function Clock() {
  const t = useT();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const current = new Date();
      setNow(current);
      timer = window.setTimeout(
        tick,
        60_000 - (current.getSeconds() * 1000 + current.getMilliseconds()),
      );
    };
    timer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000));
    return () => {
      window.clearTimeout(timer);
    };
  }, []);
  const label = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return (
    <time
      className="tray-clock"
      dateTime={now.toISOString()}
      aria-label={`${t('tray.clock')}: ${label}`}
    >
      {label}
    </time>
  );
}

export function Taskbar() {
  const t = useT();
  const { profile } = useOsIndex();
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const startOpen = useShell((s) => s.startOpen);
  const sound = useSettings((s) => s.sound);
  const lang = useSettings((s) => s.lang);

  return (
    <nav className="taskbar px-shell" aria-label={t('taskbar.label')}>
      <button
        type="button"
        id="start-button"
        className={cx('taskbar-start', startOpen && 'is-pressed')}
        aria-haspopup="menu"
        aria-expanded={startOpen}
        aria-controls={startOpen ? 'start-menu' : undefined}
        onClick={() => {
          shellStore.getState().setStartOpen(!startOpen);
        }}
      >
        <BrandMark />
        {t('taskbar.start')}
      </button>

      <ul className="taskbar-windows" aria-label={t('taskbar.windows')}>
        {Object.values(windows).map((win) => {
          const active = focusedId === win.id && !win.minimized;
          return (
            <li key={win.id}>
              <button
                type="button"
                data-taskbar-window={win.id}
                className={cx('taskbar-window', active && 'is-pressed')}
                aria-pressed={active}
                onClick={() => {
                  const store = windowStore.getState();
                  if (active) store.minimize(win.id);
                  else store.focus(win.id);
                }}
              >
                <Glyph icon={manifests[win.appId].glyph} />
                <span className="taskbar-window-title">{windowTitle(win.appId, win.params)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="tray" role="group" aria-label={t('tray.label')}>
        <span className="tray-availability" title={profile.availability.label}>
          <span
            className="availability-dot"
            data-available={String(profile.availability.available)}
          />
          <span className="sr-only">{profile.availability.label}</span>
        </span>
        <button
          type="button"
          className="tray-button"
          aria-pressed={sound}
          aria-label={sound ? t('tray.soundOn') : t('tray.soundOff')}
          onClick={() => {
            settingsStore.getState().set('sound', !sound);
          }}
        >
          <Glyph icon={sound ? Volume2 : VolumeX} />
        </button>
        <button
          type="button"
          className="tray-button"
          aria-label={t('tray.language')}
          onClick={() => {
            settingsStore.getState().set('lang', lang === 'it' ? 'en' : 'it');
          }}
        >
          {lang.toUpperCase()}
        </button>
        <Clock />
      </div>
    </nav>
  );
}
