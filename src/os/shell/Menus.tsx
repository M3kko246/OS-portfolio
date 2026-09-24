import { paths } from '@/lib/paths';
import { settingsStore } from '@/os/kernel/settings';
import { Download } from 'pixelarticons/react/Download';
import { ExternalLink } from 'pixelarticons/react/ExternalLink';
import { InfoBox } from 'pixelarticons/react/InfoBox';
import { Mail } from 'pixelarticons/react/Mail';
import { Power } from 'pixelarticons/react/Power';
import { SettingsCog } from 'pixelarticons/react/SettingsCog';
import { Image } from 'pixelarticons/react/Image';
import { Reload } from 'pixelarticons/react/Reload';
import { useCallback } from 'react';
import { useOsIndex } from '@/os/context';
import type { AppId } from '@/os/apps/ids';
import { manifests } from '@/os/apps/registry';
import { downloadCv, openApp } from '@/os/kernel/launcher';
import { sessionStore } from '@/os/kernel/session';
import { shellStore, useShell } from '@/os/kernel/shell';
import { useT } from '@/os/lib/i18n';
import { playSound } from '@/os/lib/sound';
import { Menu, type MenuCloseReason, type MenuItem } from '@/os/ui/Menu';
import { BrandMark } from '@/os/ui/primitives';

const START_APPS: AppId[] = ['welcome', 'career', 'explorer', 'photos', 'about', 'terminal'];

export function StartMenu() {
  const t = useT();
  const { profile } = useOsIndex();
  const opener = () => document.getElementById('start-button');

  const onClose = useCallback((reason: MenuCloseReason) => {
    shellStore.getState().setStartOpen(false);
    if (reason === 'escape') document.getElementById('start-button')?.focus();
  }, []);

  const items: MenuItem[] = [
    ...START_APPS.map((id) => ({
      id,
      label: t(manifests[id].titleKey),
      glyph: manifests[id].glyph,
      onSelect: () => {
        openApp(id, {}, opener());
      },
    })),
    {
      id: 'cv',
      label: t('action.downloadCv'),
      glyph: Download,
      separatorBefore: true,
      onSelect: downloadCv,
    },
    {
      id: 'contact',
      label: t('action.contactMe'),
      glyph: Mail,
      onSelect: () => {
        openApp('mail', {}, opener());
      },
    },
    {
      id: 'classic',
      label: t('nav.classic'),
      glyph: ExternalLink,
      onSelect: () => {
        window.location.assign(paths.classic(settingsStore.getState().lang));
      },
    },
    {
      id: 'settings',
      label: t('app.settings'),
      glyph: SettingsCog,
      separatorBefore: true,
      onSelect: () => {
        openApp('settings', {}, opener());
      },
    },
    {
      id: 'shutdown',
      label: t('start.shutdown'),
      glyph: Power,
      onSelect: () => {
        playSound('close');
        shellStore.getState().setShutdown(true);
      },
    },
  ];

  return (
    <Menu
      id="start-menu"
      label={t('start.label')}
      items={items}
      onClose={onClose}
      className="start-menu"
      header={
        <div className="start-header">
          <BrandMark className="brand-mark-2" />
          <div>
            <p className="start-name">{profile.name}</p>
            <p className="start-role">{profile.role}</p>
          </div>
        </div>
      }
    />
  );
}

export function DesktopMenu() {
  const t = useT();
  const { profile } = useOsIndex();
  const at = useShell((s) => s.contextMenu);

  const onClose = useCallback((reason: MenuCloseReason) => {
    shellStore.getState().setContextMenu(null);
    if (reason === 'escape') document.querySelector<HTMLElement>('[data-desktop-focus]')?.focus();
  }, []);

  if (!at) return null;
  const items: MenuItem[] = [
    {
      id: 'wallpaper',
      label: t('context.wallpaper'),
      glyph: Image,
      onSelect: () => {
        openApp('settings', { section: 'wallpaper' });
      },
    },
    {
      id: 'arrange',
      label: t('context.arrange'),
      glyph: Reload,
      onSelect: () => {
        sessionStore.getState().resetIcons();
      },
    },
    {
      id: 'settings',
      label: t('app.settings'),
      glyph: SettingsCog,
      onSelect: () => {
        openApp('settings');
      },
    },
    {
      id: 'about',
      label: t('context.about', { os: profile.osName }),
      glyph: InfoBox,
      separatorBefore: true,
      onSelect: () => {
        shellStore.getState().setAboutOpen(true);
      },
    },
  ];
  return <Menu label={t('context.label')} items={items} onClose={onClose} at={at} />;
}
