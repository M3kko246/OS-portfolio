import { useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { safeStorage, sessionFlag, setSessionFlag } from './storage';

export interface Cell {
  col: number;
  row: number;
}

export interface SessionData {
  achievements: string[];
  visitedIslands: string[];
  iconPositions: Record<string, Cell>;
  showWelcome: boolean;
  visits: number;
}

export interface SessionStore extends SessionData {
  setIconPosition: (id: string, cell: Cell) => void;
  resetIcons: () => void;
  setShowWelcome: (show: boolean) => void;
  /** Counts the visit once per browser session. */
  registerVisit: () => void;
  visitIsland: (slug: string) => void;
  /** Returns true the first time an achievement unlocks. */
  unlock: (id: string) => boolean;
}

const initial: SessionData = {
  achievements: [],
  visitedIslands: [],
  iconPositions: {},
  showWelcome: true,
  visits: 0,
};

export const sessionStore = createStore<SessionStore>()(
  persist(
    (set, get) => ({
      ...initial,
      setIconPosition: (id, cell) => {
        set((s) => ({ iconPositions: { ...s.iconPositions, [id]: cell } }));
      },
      resetIcons: () => {
        set({ iconPositions: {} });
      },
      setShowWelcome: (showWelcome) => {
        set({ showWelcome });
      },
      registerVisit: () => {
        if (sessionFlag('os:visit')) return;
        setSessionFlag('os:visit');
        set((s) => ({ visits: s.visits + 1 }));
      },
      visitIsland: (slug) => {
        if (get().visitedIslands.includes(slug)) return;
        set((s) => ({ visitedIslands: [...s.visitedIslands, slug] }));
      },
      unlock: (id) => {
        if (get().achievements.includes(id)) return false;
        set((s) => ({ achievements: [...s.achievements, id] }));
        return true;
      },
    }),
    {
      name: 'os:session',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ achievements, visitedIslands, iconPositions, showWelcome, visits }) => ({
        achievements,
        visitedIslands,
        iconPositions,
        showWelcome,
        visits,
      }),
      migrate: (persisted) => ({ ...initial, ...(persisted as Partial<SessionData>) }),
    },
  ),
);

export function useSession<T>(selector: (state: SessionStore) => T): T {
  return useStore(sessionStore, selector);
}
