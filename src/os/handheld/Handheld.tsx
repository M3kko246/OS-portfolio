import './handheld.css';
import { ArrowLeft } from 'pixelarticons/react/ArrowLeft';
import { Volume2 } from 'pixelarticons/react/Volume2';
import { VolumeX } from 'pixelarticons/react/VolumeX';
import { useEffect, useId, useRef } from 'react';
import type { MessageKey } from '@/i18n';
import type { AppId } from '@/os/apps/ids';
import type { SpriteId } from '@/os/apps/manifest';
import { useOsIndex } from '@/os/context';
import { closeWindow, openApp, windowTitle } from '@/os/kernel/launcher';
import { settingsStore, useSettings } from '@/os/kernel/settings';
import { searchFor } from '@/os/kernel/url';
import { useWindows, windowStore, type WindowState } from '@/os/kernel/windows';
import { useT } from '@/os/lib/i18n';
import { playSound } from '@/os/lib/sound';
import { cx, Glyph, Sprite } from '@/os/ui/primitives';
import { AppFrame } from '@/os/shell/AppFrame';
import { Clock } from '@/os/shell/Taskbar';
import { Wallpaper } from '@/os/shell/Wallpaper';

interface HomeIcon {
  appId: AppId;
  labelKey: MessageKey;
  sprite: SpriteId;
}

/** The dock keeps the four apps that matter most; the grid holds the rest. */
const DOCK: HomeIcon[] = [
  { appId: 'career', labelKey: 'app.career', sprite: 'career' },
  { appId: 'explorer', labelKey: 'app.explorer', sprite: 'folder' },
  { appId: 'mail', labelKey: 'app.mail', sprite: 'mail' },
  { appId: 'about', labelKey: 'app.about', sprite: 'about' },
];
const GRID: HomeIcon[] = [
  { appId: 'welcome', labelKey: 'icon.readme', sprite: 'readme' },
  { appId: 'photos', labelKey: 'app.photos', sprite: 'photos' },
  { appId: 'cv', labelKey: 'app.cv', sprite: 'pdf' },
  { appId: 'terminal', labelKey: 'app.terminal', sprite: 'terminal' },
  { appId: 'trash', labelKey: 'app.trash', sprite: 'trash' },
  { appId: 'settings', labelKey: 'app.settings', sprite: 'settings' },
];

interface HistoryEntry {
  osWindow: string;
}

function isEntry(state: unknown): state is HistoryEntry {
  return typeof state === 'object' && state !== null && 'osWindow' in state;
}

/**
 * Apps open full screen and each one pushes a history entry, so the phone's Back button closes
 * it. Closing from inside (Indietro, `exit`) goes back through history too, so the two never
 * disagree.
 */
function useBackButton() {
  const pushedRef = useRef<string[]>([]);
  const poppingRef = useRef(false);
  // Our own history.back() calls: their popstate must not close anything else.
  const ignoreRef = useRef(0);

  useEffect(() => {
    const onPopState = () => {
      if (ignoreRef.current > 0) {
        ignoreRef.current -= 1;
        return;
      }
      const top = pushedRef.current.pop();
      const win = top ? windowStore.getState().windows[top] : undefined;
      if (!win) return;
      poppingRef.current = true;
      closeWindow(win);
      poppingRef.current = false;
    };
    window.addEventListener('popstate', onPopState);

    const unsubscribe = windowStore.subscribe((state, previous) => {
      for (const id of Object.keys(state.windows)) {
        if (previous.windows[id] || pushedRef.current.includes(id)) continue;
        const win = state.windows[id];
        if (!win) continue;
        // A deep link arrives with ?app= on the first entry: that entry becomes the home screen.
        if (!isEntry(window.history.state)) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        const entry: HistoryEntry = { osWindow: id };
        window.history.pushState(
          entry,
          '',
          `${window.location.pathname}${searchFor({ appId: win.appId, params: win.params })}`,
        );
        pushedRef.current.push(id);
      }
      for (const id of Object.keys(previous.windows)) {
        if (state.windows[id] || poppingRef.current) continue;
        const at = pushedRef.current.indexOf(id);
        if (at === -1) continue;
        pushedRef.current.splice(at, 1);
        // Closed from inside the app: drop its history entry as the Back button would.
        if (at === pushedRef.current.length) {
          ignoreRef.current += 1;
          window.history.back();
        }
      }
    });

    return () => {
      window.removeEventListener('popstate', onPopState);
      unsubscribe();
    };
  }, []);
}

function StatusBar() {
  const t = useT();
  const { profile } = useOsIndex();
  const sound = useSettings((s) => s.sound);
  return (
    <header className="hh-status" aria-label={t('handheld.status')}>
      <Clock />
      <span className="hh-status-end">
        <span className="tray-availability" title={profile.availability.label}>
          <span
            className="availability-dot"
            data-available={String(profile.availability.available)}
          />
          <span className="sr-only">{profile.availability.label}</span>
        </span>
        <button
          type="button"
          className="hh-status-button"
          aria-pressed={sound}
          aria-label={sound ? t('tray.soundOn') : t('tray.soundOff')}
          onClick={() => {
            settingsStore.getState().set('sound', !sound);
            playSound('click');
          }}
        >
          <Glyph icon={sound ? Volume2 : VolumeX} />
        </button>
      </span>
    </header>
  );
}

/** File names break after the dot on narrow columns: "Leggimi." then "txt". */
function breakAfterDots(label: string): string {
  // A zero-width space is an invisible break opportunity.
  return label.replaceAll('.', '.\u200B');
}

function Icon({ icon, dock }: { icon: HomeIcon; dock?: boolean }) {
  const t = useT();
  return (
    <li>
      <button
        type="button"
        className={cx('hh-icon', dock && 'is-dock')}
        data-home-icon={icon.appId}
        onClick={(event) => {
          openApp(icon.appId, {}, event.currentTarget);
        }}
      >
        <Sprite id={icon.sprite} />
        <span className="hh-icon-label">{breakAfterDots(t(icon.labelKey))}</span>
      </button>
    </li>
  );
}

function AppScreen({ win }: { win: WindowState }) {
  const t = useT();
  const titleId = useId();
  const ref = useRef<HTMLElement>(null);

  // Like a desktop window: focus goes to the first useful control of the app.
  useEffect(() => {
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>(
      '.hh-app-body :is([data-autofocus], a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex="0"])',
    );
    (first ?? el)?.focus();
  }, [win.id]);

  return (
    <section
      ref={ref}
      className="hh-app"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className="hh-app-bar">
        <button
          type="button"
          className="hh-back"
          onClick={() => {
            closeWindow(win);
          }}
        >
          <Glyph icon={ArrowLeft} />
          {t('handheld.back')}
        </button>
        <p id={titleId} className="hh-app-title">
          {windowTitle(win.appId, win.params)}
        </p>
      </div>
      <div className="hh-app-body window-body">
        <AppFrame win={win} />
      </div>
    </section>
  );
}

/** The handheld shell: status bar, home screen in four columns, dock, apps full screen. */
export function Handheld() {
  const t = useT();
  const windows = useWindows((s) => s.windows);
  const order = useWindows((s) => s.order);
  const topId = order.at(-1);
  const top = topId ? windows[topId] : undefined;
  const lastIconRef = useRef<string | null>(null);

  useBackButton();

  // Back on the home screen, focus returns to the icon that opened the last app.
  useEffect(() => {
    if (top) {
      lastIconRef.current = top.appId;
      return;
    }
    const icon = lastIconRef.current;
    if (icon) document.querySelector<HTMLElement>(`[data-home-icon="${icon}"]`)?.focus();
  }, [top]);

  return (
    <div className="handheld">
      <StatusBar />
      <div className="hh-home" inert={top !== undefined}>
        <Wallpaper fit="cover" />
        <nav className="hh-grid" aria-label={t('handheld.home')}>
          <ul>
            {GRID.map((icon) => (
              <Icon key={icon.appId} icon={icon} />
            ))}
          </ul>
        </nav>
        <nav className="hh-dock" aria-label={t('handheld.dock')}>
          <ul>
            {DOCK.map((icon) => (
              <Icon key={icon.appId} icon={icon} dock />
            ))}
          </ul>
        </nav>
      </div>
      {top && <AppScreen key={top.id} win={top} />}
    </div>
  );
}
