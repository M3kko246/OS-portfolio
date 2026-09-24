import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { Vec2 } from './logic/math';

export interface Interactable {
  id: string;
  kind: 'project' | 'about' | 'mail' | 'controls' | 'next';
  label: string;
  position: Vec2;
  island: number;
  slug?: string;
}

/**
 * Discrete game UI state. Per-frame values (player position, camera) never go through here:
 * they live in mutable refs read by the render loop.
 */
export interface GameStore {
  panel: Interactable | null;
  map: boolean;
  paused: boolean;
  graphics: boolean;
  prompt: Interactable | null;
  hint: boolean;
  /** Increments to ask the loop for a stepped fade (teleport). */
  flash: number;
  set: (patch: Partial<Omit<GameStore, 'set' | 'reset'>>) => void;
  reset: () => void;
}

const initial = {
  panel: null,
  map: false,
  paused: false,
  graphics: false,
  prompt: null,
  hint: true,
  flash: 0,
};

export const gameStore = createStore<GameStore>()((set) => ({
  ...initial,
  set: (patch) => {
    set(patch);
  },
  reset: () => {
    set(initial);
  },
}));

export function useGame<T>(selector: (state: GameStore) => T): T {
  return useStore(gameStore, selector);
}
