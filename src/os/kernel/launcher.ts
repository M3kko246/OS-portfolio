import { t } from '@/i18n';
import type { AppId, AppParams } from '@/os/apps/ids';
import { manifests } from '@/os/apps/registry';
import { announce } from '@/os/lib/announce';
import { playSound } from '@/os/lib/sound';
import type { OsIndex } from '@/os/types';
import { settingsStore } from './settings';
import { windowIdFor, windowStore, type WindowId, type WindowState } from './windows';

/**
 * Opening and closing windows from anywhere: icons, menus, Esegui, deep links, app buttons.
 * Remembers which element opened each window, to animate from it and give focus back to it.
 */
let index: OsIndex | null = null;
const openers = new Map<WindowId, HTMLElement>();
const openRects = new Map<WindowId, DOMRect>();

export function setLauncherIndex(next: OsIndex): void {
  index = next;
}

export function windowTitle(appId: AppId, params: AppParams): string {
  const lang = settingsStore.getState().lang;
  const project = params.slug ? index?.projects.find((p) => p.slug === params.slug) : undefined;
  if (project && (appId === 'project' || appId === 'demo')) return project.title;
  if (project && appId === 'reader') return `Leggimi.md, ${project.title}`;
  return t(manifests[appId].titleKey, {}, lang);
}

export function openApp(appId: AppId, params: AppParams = {}, opener?: Element | null): WindowId {
  const manifest = manifests[appId];
  const title = windowTitle(appId, params);
  const store = windowStore.getState();
  const key = manifest.instanceKey?.(params);
  const existed =
    store.windows[
      windowIdFor({ appId, singleton: manifest.singleton, ...(key === undefined ? {} : { key }) })
    ] !== undefined;
  const id = store.open({
    appId,
    title,
    params,
    singleton: manifest.singleton,
    ...(key === undefined ? {} : { key }),
    size: manifest.defaultRect,
    min: manifest.minSize,
  });
  if (!existed) {
    if (opener instanceof HTMLElement) {
      openers.set(id, opener);
      openRects.set(id, opener.getBoundingClientRect());
    }
    announce(t('window.opened', { title }, settingsStore.getState().lang));
    playSound('open');
  }
  return id;
}

/** The rect to animate a new window from, consumed once. */
export function takeOpenRect(id: WindowId): DOMRect | undefined {
  const rect = openRects.get(id);
  openRects.delete(id);
  return rect;
}

export function closeWindow(win: WindowState): void {
  const opener = openers.get(win.id);
  openers.delete(win.id);
  windowStore.getState().close(win.id);
  announce(t('window.closed', { title: win.title }, settingsStore.getState().lang));
  playSound('close');
  // Focus goes back to whatever opened the window, or to the desktop.
  if (opener?.isConnected && opener.checkVisibility()) opener.focus();
  else document.querySelector<HTMLElement>('[data-desktop-focus]')?.focus();
}

export function openExternal(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function downloadCv(): void {
  const link = document.createElement('a');
  link.href = index?.profile.cv.it ?? '/cv/CV.pdf';
  link.download = '';
  link.click();
}
