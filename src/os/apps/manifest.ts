import type { ComponentType, JSX, SVGProps } from 'react';
import type { MessageKey } from '@/i18n';
import type { Size } from '@/os/kernel/geometry';
import type { AppId, AppParams } from './ids';

export type SpriteId =
  | 'readme'
  | 'career'
  | 'folder'
  | 'photos'
  | 'about'
  | 'pdf'
  | 'mail'
  | 'terminal'
  | 'trash'
  | 'settings';

export type Glyph = (props: SVGProps<SVGSVGElement>) => JSX.Element;

export interface AppProps {
  windowId: string;
  params: AppParams;
}

/** Shape of the loading placeholder: it matches the app's final layout, never a spinner. */
export type SkeletonShape = 'document' | 'grid' | 'form' | 'split' | 'canvas';

export interface AppManifest {
  id: AppId;
  titleKey: MessageKey;
  icon: SpriteId;
  glyph: Glyph;
  singleton: boolean;
  /** Art pixels. */
  defaultRect: Size;
  minSize: Size;
  handheld: 'fullscreen' | 'hidden';
  skeleton: SkeletonShape;
  load: () => Promise<{ default: ComponentType<AppProps> }>;
  /** Identity of multi-instance windows, e.g. one window per project. */
  instanceKey?: (params: AppParams) => string | undefined;
}
