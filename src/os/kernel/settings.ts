import { useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import type { TimeOfDay } from '@/design/time';
import type { Lang } from '@/i18n';
import { safeStorage } from './storage';

export const SETTINGS_KEY = 'os:settings';

export type WallpaperId = 'auto' | TimeOfDay | 'solid-night' | 'solid-chalk' | 'drafts';

/** Cosmetics unlocked by achievements (src/os/kernel/achievements.ts). */
export type HatId = 'none' | 'captain' | 'nightcap';
export type TerminalTheme = 'classic' | 'amber' | 'paper';

export interface Settings {
  theme: 'auto' | 'light' | 'dark';
  wallpaper: WallpaperId;
  sound: boolean;
  volume: number;
  scale: 'auto' | 'large';
  motion: 'auto' | 'reduced';
  crt: boolean;
  dithering: boolean;
  quality: 'auto' | 'high' | 'low';
  lang: Lang;
  pixelCursor: boolean;
  mode: 'auto' | 'desktop' | 'handheld';
  hat: HatId;
  terminalTheme: TerminalTheme;
}

export const defaultSettings: Settings = {
  theme: 'auto',
  wallpaper: 'auto',
  sound: false,
  volume: 0.6,
  scale: 'auto',
  motion: 'auto',
  crt: false,
  dithering: true,
  quality: 'auto',
  lang: 'it',
  pixelCursor: false,
  mode: 'auto',
  hat: 'none',
  terminalTheme: 'classic',
};

const keys = Object.keys(defaultSettings) as (keyof Settings)[];

export interface SettingsStore extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
}

export const settingsStore = createStore<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      set: (key, value) => {
        set({ [key]: value });
      },
      reset: () => {
        set(defaultSettings);
      },
    }),
    {
      name: SETTINGS_KEY,
      version: 3,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) =>
        Object.fromEntries(keys.map((key) => [key, state[key]])) as unknown as Settings,
      // Unknown or missing fields from older versions fall back to the defaults.
      migrate: (persisted, version) => {
        const settings = { ...defaultSettings, ...(persisted as Partial<Settings>) };
        // Before v3 the time-of-day wallpapers did not exist and the plain night stood in for them.
        if (version < 3 && settings.wallpaper !== 'solid-chalk') settings.wallpaper = 'auto';
        return settings;
      },
    },
  ),
);

export function useSettings<T>(selector: (state: SettingsStore) => T): T {
  return useStore(settingsStore, selector);
}
