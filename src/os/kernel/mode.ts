import { useSyncExternalStore } from 'react';
import { settingsStore, useSettings } from './settings';

/**
 * Desktop or handheld (PROMPT.md §2.10): below 768 px the system becomes a retro handheld,
 * from tablets up it stays a desktop, touch or not. Settings can force either mode.
 */
const NARROW = '(max-width: 767.98px)';

function subscribeNarrow(onChange: () => void): () => void {
  const query = window.matchMedia(NARROW);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
}
const narrowNow = () => window.matchMedia(NARROW).matches;

export function useHandheld(): boolean {
  const mode = useSettings((s) => s.mode);
  const narrow = useSyncExternalStore(subscribeNarrow, narrowNow, () => false);
  return mode === 'handheld' || (mode === 'auto' && narrow);
}

export function isHandheld(): boolean {
  const { mode } = settingsStore.getState();
  return mode === 'handheld' || (mode === 'auto' && narrowNow());
}
