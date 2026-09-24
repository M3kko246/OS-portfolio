import { useSyncExternalStore } from 'react';
import { pixelUnit } from '@/design/pixel';

let unit = 1;
const listeners = new Set<() => void>();

/**
 * Keeps `--u` equal to a whole number of device pixels (PROMPT.md §4.5). Recomputes on resize and
 * whenever the device pixel ratio changes (zoom, moving to another screen): the resolution media
 * query is re-registered for the new ratio each time.
 */
export function startPixelScale(getUserScale: () => number): () => void {
  let query: MediaQueryList | undefined;

  const apply = () => {
    const dpr = window.devicePixelRatio || 1;
    const next = pixelUnit(dpr, getUserScale());
    query?.removeEventListener('change', apply);
    query = window.matchMedia(`(resolution: ${dpr}dppx)`);
    query.addEventListener('change', apply);
    if (next === unit && document.documentElement.style.getPropertyValue('--u') !== '') return;
    unit = next;
    document.documentElement.style.setProperty('--u', `${next}px`);
    for (const listener of listeners) listener();
  };

  apply();
  window.addEventListener('resize', apply);
  return () => {
    query?.removeEventListener('change', apply);
    window.removeEventListener('resize', apply);
  };
}

export function refreshPixelScale(): void {
  window.dispatchEvent(new Event('resize'));
}

export function getUnit(): number {
  return unit;
}

export function onUnitChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** One art pixel in CSS px, reactive. */
export function useUnit(): number {
  return useSyncExternalStore(onUnitChange, getUnit, () => 1);
}
