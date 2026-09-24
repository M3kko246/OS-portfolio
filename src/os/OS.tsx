import '@/styles/os.css';
import { useCallback, useEffect } from 'react';
import { setLauncherIndex, openApp } from './kernel/launcher';
import { sessionStore } from './kernel/session';
import { settingsStore, useSettings } from './kernel/settings';
import { shellStore, useShell } from './kernel/shell';
import { parseSearch, searchFor } from './kernel/url';
import { windowStore } from './kernel/windows';
import { OsIndexContext } from './context';
import { registerAnnouncer } from './lib/announce';
import { useT } from './lib/i18n';
import { useReducedMotion } from './lib/motion';
import { getUnit, onUnitChange, refreshPixelScale, startPixelScale } from './lib/pixel-scale';
import { Boot } from './shell/Boot';
import { Desktop } from './shell/Desktop';
import { AboutDialog, Shutdown } from './shell/Dialogs';
import { registerZoomLayer } from './shell/layers';
import { DesktopMenu, StartMenu } from './shell/Menus';
import { RunDialog } from './shell/RunDialog';
import { Taskbar } from './shell/Taskbar';
import { WindowLayer } from './shell/WindowLayer';
import type { OsIndex } from './types';

function useSystemEffects() {
  const theme = useSettings((s) => s.theme);
  const scale = useSettings((s) => s.scale);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') root.removeAttribute('data-theme');
    else root.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'auto';
  }, [reduced]);

  useEffect(
    () => startPixelScale(() => (settingsStore.getState().scale === 'large' ? 1.5 : 1)),
    [],
  );
  useEffect(() => {
    refreshPixelScale();
  }, [scale]);

  // Work area: the viewport above the taskbar, in art pixels.
  useEffect(() => {
    const update = () => {
      const bar = document.querySelector('.taskbar')?.getBoundingClientRect().height ?? 0;
      const u = getUnit();
      windowStore.getState().setArea({
        w: Math.floor(window.innerWidth / u),
        h: Math.floor((window.innerHeight - bar) / u),
      });
    };
    update();
    window.addEventListener('resize', update);
    const stop = onUnitChange(update);
    const observer = new ResizeObserver(update);
    const bar = document.querySelector('.taskbar');
    if (bar) observer.observe(bar);
    return () => {
      window.removeEventListener('resize', update);
      stop();
      observer.disconnect();
    };
  }, []);

  // Ctrl+K or Cmd+K opens Esegui. No other global shortcut: the browser keeps its own.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (shellStore.getState().shutdown) return;
        event.preventDefault();
        shellStore.getState().setRunOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // The address bar follows the window in front, so every window has a shareable link.
  useEffect(
    () =>
      windowStore.subscribe((state, previous) => {
        if (!shellStore.getState().booted) return;
        if (state.focusedId === previous.focusedId && state.windows === previous.windows) return;
        const win = state.focusedId ? state.windows[state.focusedId] : undefined;
        const search = searchFor(win ? { appId: win.appId, params: win.params } : null);
        if (window.location.search !== search) {
          window.history.replaceState(
            window.history.state,
            '',
            `${window.location.pathname}${search}`,
          );
        }
      }),
    [],
  );
}

export default function OS({ data }: { data: OsIndex }) {
  const t = useT();
  const startOpen = useShell((s) => s.startOpen);

  useEffect(() => {
    setLauncherIndex(data);
    sessionStore.getState().registerVisit();
  }, [data]);

  useSystemEffects();

  const onBooted = useCallback(() => {
    shellStore.getState().setBooted();
    const intent = parseSearch(window.location.search, new Set(data.projects.map((p) => p.slug)));
    if (intent) openApp(intent.appId, intent.params);
    else if (sessionStore.getState().showWelcome) openApp('welcome');
    else document.querySelector<HTMLElement>('[data-desktop-focus]')?.focus();
  }, [data]);

  return (
    <OsIndexContext value={data}>
      <div className="os">
        <a className="skip-link font-pixel text-ui" href="/classica">
          {t('nav.goClassic')}
        </a>
        <Desktop />
        <WindowLayer />
        <Taskbar />
        {startOpen && <StartMenu />}
        <DesktopMenu />
        <RunDialog />
        <AboutDialog />
        <Shutdown />
        <div ref={registerZoomLayer} className="zoom-layer" aria-hidden="true" />
        <div ref={registerAnnouncer} className="sr-only" aria-live="polite" />
        <Boot onDone={onBooted} />
      </div>
    </OsIndexContext>
  );
}
