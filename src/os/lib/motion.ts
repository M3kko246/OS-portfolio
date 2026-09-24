import { useSyncExternalStore } from 'react';
import { settingsStore, useSettings } from '@/os/kernel/settings';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(listener: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', listener);
  return () => {
    query.removeEventListener('change', listener);
  };
}

const systemPrefersReduced = () => window.matchMedia(QUERY).matches;

/** Reduced motion from the system preference or from Settings > Movimento: Ridotto. */
export function useReducedMotion(): boolean {
  const system = useSyncExternalStore(subscribe, systemPrefersReduced, () => true);
  const setting = useSettings((s) => s.motion);
  return system || setting === 'reduced';
}

/** Same rule, outside React (animations started from event handlers). */
export function reducedMotionNow(): boolean {
  return systemPrefersReduced() || settingsStore.getState().motion === 'reduced';
}

/** One step of the system's motion language: every duration is a multiple of 40 ms. */
export const STEP_MS = 40;
