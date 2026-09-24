import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { File } from 'pixelarticons/react/File';
import { FileText } from 'pixelarticons/react/FileText';
import { Folder } from 'pixelarticons/react/Folder';
import { Globe } from 'pixelarticons/react/Globe';
import { Image } from 'pixelarticons/react/Image';
import { Mail } from 'pixelarticons/react/Mail';
import { Map as MapGlyph } from 'pixelarticons/react/Map';
import { SettingsCog } from 'pixelarticons/react/SettingsCog';
import { Terminal } from 'pixelarticons/react/Terminal';
import { Trash } from 'pixelarticons/react/Trash';
import { User } from 'pixelarticons/react/User';
import type { AppId } from './ids';
import type { AppManifest, AppProps } from './manifest';

// Carriera (T4), Terminale and Cestino (T5) show ComingSoon until their stage.
const comingSoon = () => import('./ComingSoon');
const bySlug = (params: Readonly<Record<string, string>>) => params.slug;

export const manifests: Record<AppId, AppManifest> = {
  welcome: {
    id: 'welcome',
    titleKey: 'app.welcome',
    icon: 'readme',
    glyph: FileText,
    singleton: true,
    defaultRect: { w: 440, h: 312 },
    minSize: { w: 320, h: 260 },
    handheld: 'fullscreen',
    skeleton: 'document',
    load: () => import('./welcome/Welcome'),
  },
  career: {
    id: 'career',
    titleKey: 'app.career',
    icon: 'career',
    glyph: MapGlyph,
    singleton: true,
    defaultRect: { w: 800, h: 520 },
    minSize: { w: 480, h: 320 },
    handheld: 'fullscreen',
    skeleton: 'canvas',
    load: comingSoon,
  },
  explorer: {
    id: 'explorer',
    titleKey: 'app.explorer',
    icon: 'folder',
    glyph: Folder,
    singleton: true,
    defaultRect: { w: 640, h: 420 },
    minSize: { w: 400, h: 280 },
    handheld: 'fullscreen',
    skeleton: 'grid',
    load: () => import('./explorer/Explorer'),
  },
  project: {
    id: 'project',
    titleKey: 'app.project',
    icon: 'folder',
    glyph: Folder,
    singleton: false,
    defaultRect: { w: 640, h: 480 },
    minSize: { w: 380, h: 300 },
    handheld: 'fullscreen',
    skeleton: 'document',
    load: () => import('./project/Project'),
    instanceKey: bySlug,
  },
  reader: {
    id: 'reader',
    titleKey: 'app.reader',
    icon: 'readme',
    glyph: FileText,
    singleton: false,
    defaultRect: { w: 640, h: 520 },
    minSize: { w: 360, h: 300 },
    handheld: 'fullscreen',
    skeleton: 'document',
    load: () => import('./reader/Reader'),
    instanceKey: bySlug,
  },
  demo: {
    id: 'demo',
    titleKey: 'app.demo',
    icon: 'readme',
    glyph: Globe,
    singleton: false,
    defaultRect: { w: 800, h: 560 },
    minSize: { w: 400, h: 300 },
    handheld: 'fullscreen',
    skeleton: 'canvas',
    load: () => import('./demo/Demo'),
    instanceKey: bySlug,
  },
  photos: {
    id: 'photos',
    titleKey: 'app.photos',
    icon: 'photos',
    glyph: Image,
    singleton: true,
    defaultRect: { w: 680, h: 480 },
    minSize: { w: 380, h: 300 },
    handheld: 'fullscreen',
    skeleton: 'grid',
    load: () => import('./photos/Photos'),
  },
  about: {
    id: 'about',
    titleKey: 'app.about',
    icon: 'about',
    glyph: User,
    singleton: true,
    defaultRect: { w: 560, h: 440 },
    minSize: { w: 380, h: 320 },
    handheld: 'fullscreen',
    skeleton: 'split',
    load: () => import('./about/About'),
  },
  cv: {
    id: 'cv',
    titleKey: 'app.cv',
    icon: 'pdf',
    glyph: File,
    singleton: true,
    defaultRect: { w: 620, h: 560 },
    minSize: { w: 360, h: 320 },
    handheld: 'fullscreen',
    skeleton: 'document',
    load: () => import('./cv/Cv'),
  },
  mail: {
    id: 'mail',
    titleKey: 'app.mail',
    icon: 'mail',
    glyph: Mail,
    singleton: true,
    defaultRect: { w: 560, h: 480 },
    minSize: { w: 360, h: 380 },
    handheld: 'fullscreen',
    skeleton: 'form',
    load: () => import('./mail/Mail'),
  },
  terminal: {
    id: 'terminal',
    titleKey: 'app.terminal',
    icon: 'terminal',
    glyph: Terminal,
    singleton: true,
    defaultRect: { w: 600, h: 380 },
    minSize: { w: 360, h: 220 },
    handheld: 'fullscreen',
    skeleton: 'document',
    load: comingSoon,
  },
  settings: {
    id: 'settings',
    titleKey: 'app.settings',
    icon: 'readme',
    glyph: SettingsCog,
    singleton: true,
    defaultRect: { w: 520, h: 460 },
    minSize: { w: 360, h: 320 },
    handheld: 'fullscreen',
    skeleton: 'form',
    load: () => import('./settings/Settings'),
  },
  trash: {
    id: 'trash',
    titleKey: 'app.trash',
    icon: 'trash',
    glyph: Trash,
    singleton: true,
    defaultRect: { w: 480, h: 320 },
    minSize: { w: 320, h: 220 },
    handheld: 'fullscreen',
    skeleton: 'grid',
    load: comingSoon,
  },
};

// Created once per app at module level, never inside a render.
export const appComponents = Object.fromEntries(
  Object.values(manifests).map((m) => [m.id, lazy(m.load)]),
) as Record<AppId, LazyExoticComponent<ComponentType<AppProps>>>;
