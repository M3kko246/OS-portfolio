import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { AppId, AppParams } from '@/os/apps/ids';
import {
  cascadeRect,
  clampRect,
  layoutForSide,
  type Layout,
  type Rect,
  type Size,
  type SnapSide,
} from './geometry';

export type WindowId = string;

export interface WindowState {
  id: WindowId;
  appId: AppId;
  title: string;
  params: AppParams;
  /** Restore rect, used when the layout is `normal`. */
  rect: Rect;
  layout: Layout;
  minimized: boolean;
  min: Size;
}

export interface OpenSpec {
  appId: AppId;
  title: string;
  params?: AppParams;
  /** Deterministic identity: singletons use the app id, others `app:key`. */
  singleton: boolean;
  key?: string;
  size: Size;
  min: Size;
}

export interface WindowsStore {
  windows: Record<WindowId, WindowState>;
  /** Bottom to top. */
  order: WindowId[];
  focusedId: WindowId | null;
  area: Size;
  opened: number;
  open: (spec: OpenSpec) => WindowId;
  close: (id: WindowId) => void;
  focus: (id: WindowId) => void;
  minimize: (id: WindowId) => void;
  toggleMaximize: (id: WindowId) => void;
  snap: (id: WindowId, side: SnapSide | null) => void;
  setRect: (id: WindowId, rect: Rect) => void;
  setTitle: (id: WindowId, title: string) => void;
  setArea: (area: Size) => void;
}

export function windowIdFor(spec: Pick<OpenSpec, 'appId' | 'singleton' | 'key'>): WindowId {
  return spec.singleton || spec.key === undefined ? spec.appId : `${spec.appId}:${spec.key}`;
}

/** Top-most visible window other than `except`, or null. */
function nextFocus(state: Pick<WindowsStore, 'order' | 'windows'>, except?: WindowId) {
  for (let i = state.order.length - 1; i >= 0; i--) {
    const id = state.order[i];
    if (id !== undefined && id !== except && state.windows[id]?.minimized === false) return id;
  }
  return null;
}

export function createWindowStore(area: Size = { w: 1024, h: 700 }) {
  return createStore<WindowsStore>()((set, get) => ({
    windows: {},
    order: [],
    focusedId: null,
    area,
    opened: 0,

    open: (spec) => {
      const id = windowIdFor(spec);
      const existing = get().windows[id];
      if (existing) {
        // Reopening with new parameters (e.g. Carriera on another island) updates them.
        if (spec.params && JSON.stringify(spec.params) !== JSON.stringify(existing.params)) {
          const params = spec.params;
          set((state) => ({ windows: { ...state.windows, [id]: { ...existing, params } } }));
        }
        get().focus(id);
        return id;
      }
      set((state) => {
        const rect = cascadeRect(state.opened, spec.size, state.area, spec.min);
        const win: WindowState = {
          id,
          appId: spec.appId,
          title: spec.title,
          params: spec.params ?? {},
          rect,
          layout: 'normal',
          minimized: false,
          min: spec.min,
        };
        return {
          windows: { ...state.windows, [id]: win },
          order: [...state.order, id],
          focusedId: id,
          opened: state.opened + 1,
        };
      });
      return id;
    },

    close: (id) => {
      set((state) => {
        if (!state.windows[id]) return state;
        const windows = Object.fromEntries(
          Object.entries(state.windows).filter(([key]) => key !== id),
        );
        const order = state.order.filter((w) => w !== id);
        const focusedId = state.focusedId === id ? nextFocus({ order, windows }) : state.focusedId;
        return { windows, order, focusedId };
      });
    },

    focus: (id) => {
      set((state) => {
        const win = state.windows[id];
        if (!win) return state;
        return {
          windows: win.minimized
            ? { ...state.windows, [id]: { ...win, minimized: false } }
            : state.windows,
          order: [...state.order.filter((w) => w !== id), id],
          focusedId: id,
        };
      });
    },

    minimize: (id) => {
      set((state) => {
        const win = state.windows[id];
        if (!win) return state;
        const windows = { ...state.windows, [id]: { ...win, minimized: true } };
        const focusedId =
          state.focusedId === id ? nextFocus({ order: state.order, windows }, id) : state.focusedId;
        return { windows, focusedId };
      });
    },

    toggleMaximize: (id) => {
      set((state) => {
        const win = state.windows[id];
        if (!win) return state;
        const layout: Layout = win.layout === 'maximized' ? 'normal' : 'maximized';
        return { windows: { ...state.windows, [id]: { ...win, layout } } };
      });
    },

    snap: (id, side) => {
      set((state) => {
        const win = state.windows[id];
        if (!win) return state;
        const layout = side ? layoutForSide(side) : 'normal';
        return { windows: { ...state.windows, [id]: { ...win, layout } } };
      });
    },

    setRect: (id, rect) => {
      set((state) => {
        const win = state.windows[id];
        if (!win) return state;
        const next = {
          ...win,
          layout: 'normal' as const,
          rect: clampRect(rect, state.area, win.min),
        };
        return { windows: { ...state.windows, [id]: next } };
      });
    },

    setTitle: (id, title) => {
      set((state) => {
        const win = state.windows[id];
        if (!win || win.title === title) return state;
        return { windows: { ...state.windows, [id]: { ...win, title } } };
      });
    },

    setArea: (next) => {
      set((state) => {
        if (state.area.w === next.w && state.area.h === next.h) return state;
        const windows = Object.fromEntries(
          Object.entries(state.windows).map(([id, win]) => [
            id,
            { ...win, rect: clampRect(win.rect, next, win.min) },
          ]),
        );
        return { area: next, windows };
      });
    },
  }));
}

export type WindowStoreApi = ReturnType<typeof createWindowStore>;

/** The system's single window manager. */
export const windowStore = createWindowStore();

export function useWindows<T>(selector: (state: WindowsStore) => T): T {
  return useStore(windowStore, selector);
}
