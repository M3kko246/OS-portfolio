import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

/** Transient shell UI: menus and dialogs. Not persisted. */
export interface ShellStore {
  startOpen: boolean;
  contextMenu: { x: number; y: number } | null;
  runOpen: boolean;
  aboutOpen: boolean;
  shutdown: boolean;
  booted: boolean;
  setStartOpen: (open: boolean) => void;
  setContextMenu: (at: { x: number; y: number } | null) => void;
  setRunOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  setShutdown: (on: boolean) => void;
  setBooted: () => void;
}

export const shellStore = createStore<ShellStore>()((set) => ({
  startOpen: false,
  contextMenu: null,
  runOpen: false,
  aboutOpen: false,
  shutdown: false,
  booted: false,
  setStartOpen: (startOpen) => {
    set({ startOpen, contextMenu: null });
  },
  setContextMenu: (contextMenu) => {
    set({ contextMenu, startOpen: false });
  },
  setRunOpen: (runOpen) => {
    set({ runOpen, startOpen: false, contextMenu: null });
  },
  setAboutOpen: (aboutOpen) => {
    set({ aboutOpen, contextMenu: null });
  },
  setShutdown: (shutdown) => {
    set({ shutdown, startOpen: false, contextMenu: null, runOpen: false });
  },
  setBooted: () => {
    set({ booted: true });
  },
}));

export function useShell<T>(selector: (state: ShellStore) => T): T {
  return useStore(shellStore, selector);
}
