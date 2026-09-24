import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { subscribeTimeOfDay, timeOfDay } from '@/design/time';
import { playSound } from '@/os/lib/sound';
import { sessionStore } from './session';
import type { HatId, TerminalTheme, WallpaperId } from './settings';

export type AchievementId = 'explorer' | 'curious' | 'archaeologist' | 'nightOwl' | 'veteran';

export type Reward =
  | { kind: 'hat'; value: Exclude<HatId, 'none'> }
  | { kind: 'terminalTheme'; value: Exclude<TerminalTheme, 'classic'> }
  | { kind: 'wallpaper'; value: Extract<WallpaperId, 'drafts'> };

/** At most five (PROMPT.md §2.9), each with one cosmetic reward. */
export const ACHIEVEMENTS: readonly { id: AchievementId; reward: Reward }[] = [
  { id: 'explorer', reward: { kind: 'hat', value: 'captain' } },
  { id: 'curious', reward: { kind: 'terminalTheme', value: 'amber' } },
  { id: 'archaeologist', reward: { kind: 'wallpaper', value: 'drafts' } },
  { id: 'nightOwl', reward: { kind: 'hat', value: 'nightcap' } },
  { id: 'veteran', reward: { kind: 'terminalTheme', value: 'paper' } },
];

/** Message key naming a reward, e.g. in the notice that announces it. */
export function rewardKey(reward: Reward) {
  switch (reward.kind) {
    case 'hat':
      return `reward.hat.${reward.value}` as const;
    case 'terminalTheme':
      return `reward.terminalTheme.${reward.value}` as const;
    case 'wallpaper':
      return `reward.wallpaper.${reward.value}` as const;
  }
}

/** The achievement that unlocks a cosmetic, or undefined for the ones everybody has. */
export function unlockedBy(kind: Reward['kind'], value: string): AchievementId | undefined {
  return ACHIEVEMENTS.find((a) => a.reward.kind === kind && a.reward.value === value)?.id;
}

export function isAvailable(
  kind: Reward['kind'],
  value: string,
  unlocked: readonly string[],
): boolean {
  const id = unlockedBy(kind, value);
  return id === undefined || unlocked.includes(id);
}

/** Pixel notices in the bottom right corner, one at a time. Not persisted. */
interface ToastStore {
  queue: AchievementId[];
  push: (id: AchievementId) => void;
  shift: () => void;
}

export const toastStore = createStore<ToastStore>()((set) => ({
  queue: [],
  push: (id) => {
    set((s) => ({ queue: [...s.queue, id] }));
  },
  shift: () => {
    set((s) => ({ queue: s.queue.slice(1) }));
  },
}));

export function useToasts<T>(selector: (state: ToastStore) => T): T {
  return useStore(toastStore, selector);
}

/** Unlocks once, persisted in the session store; the first time it also notifies. */
export function unlockAchievement(id: AchievementId): void {
  if (!sessionStore.getState().unlock(id)) return;
  toastStore.getState().push(id);
  playSound('achievement');
}

/**
 * Achievements that follow from the session rather than from one action: third visit, a visit
 * at night, every project island visited. Started once the boot screen is gone.
 */
export function watchAchievements(projectSlugs: readonly string[]): () => void {
  if (sessionStore.getState().visits >= 3) unlockAchievement('veteran');

  const checkNight = () => {
    if (timeOfDay() === 'night') unlockAchievement('nightOwl');
  };
  checkNight();
  const stopClock = subscribeTimeOfDay(checkNight);

  const checkIslands = (visited: readonly string[]) => {
    if (projectSlugs.length > 0 && projectSlugs.every((slug) => visited.includes(slug))) {
      unlockAchievement('explorer');
    }
  };
  checkIslands(sessionStore.getState().visitedIslands);
  const stopIslands = sessionStore.subscribe((state, previous) => {
    if (state.visitedIslands !== previous.visitedIslands) checkIslands(state.visitedIslands);
  });

  return () => {
    stopClock();
    stopIslands();
  };
}
