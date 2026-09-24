import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** A localStorage that survives module reloads, like the real one across page loads. */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('localStorage', memoryStorage());
  vi.stubGlobal('sessionStorage', memoryStorage());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('achievements', () => {
  it('are persisted and restored after a reload, and notify only once', async () => {
    const first = await import('@/os/kernel/achievements');
    first.unlockAchievement('curious');
    expect(first.toastStore.getState().queue).toEqual(['curious']);
    const saved = JSON.parse(localStorage.getItem('os:session') ?? '{}') as {
      state: { achievements: string[] };
    };
    expect(saved.state.achievements).toEqual(['curious']);

    // A new page load: fresh modules, same storage.
    vi.resetModules();
    const { sessionStore } = await import('@/os/kernel/session');
    const second = await import('@/os/kernel/achievements');
    expect(sessionStore.getState().achievements).toEqual(['curious']);
    second.unlockAchievement('curious');
    expect(second.toastStore.getState().queue).toEqual([]);
  });

  it('keep cosmetics locked until their achievement', async () => {
    const { isAvailable } = await import('@/os/kernel/achievements');
    expect(isAvailable('hat', 'captain', [])).toBe(false);
    expect(isAvailable('hat', 'captain', ['explorer'])).toBe(true);
    expect(isAvailable('hat', 'none', [])).toBe(true);
    expect(isAvailable('wallpaper', 'drafts', ['archaeologist'])).toBe(true);
  });

  it('unlock Veterano on the third visit and Esploratore with every island', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 24, 12, 0));
    const { sessionStore } = await import('@/os/kernel/session');
    const { watchAchievements } = await import('@/os/kernel/achievements');
    sessionStore.setState({ visits: 3 });
    const stop = watchAchievements(['alfa', 'beta']);
    expect(sessionStore.getState().achievements).toEqual(['veteran']);
    sessionStore.getState().visitIsland('alfa');
    expect(sessionStore.getState().achievements).not.toContain('explorer');
    sessionStore.getState().visitIsland('beta');
    expect(sessionStore.getState().achievements).toContain('explorer');
    stop();
  });

  it('unlock Nottambulo at night, also when the night starts during the visit', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 24, 20, 59));
    const { sessionStore } = await import('@/os/kernel/session');
    const { watchAchievements } = await import('@/os/kernel/achievements');
    const stop = watchAchievements([]);
    expect(sessionStore.getState().achievements).not.toContain('nightOwl');
    vi.advanceTimersByTime(2 * 60_000);
    expect(sessionStore.getState().achievements).toContain('nightOwl');
    stop();
  });
});

describe('settings migration', () => {
  it('moves the old plain default to the time-of-day wallpaper and adds new fields', async () => {
    localStorage.setItem(
      'os:settings',
      JSON.stringify({ state: { wallpaper: 'solid-night', sound: true }, version: 2 }),
    );
    const { settingsStore } = await import('@/os/kernel/settings');
    const state = settingsStore.getState();
    expect(state.wallpaper).toBe('auto');
    expect(state.sound).toBe(true);
    expect(state.hat).toBe('none');
    expect(state.terminalTheme).toBe('classic');
  });

  it('keeps an explicit choice of the chalk wallpaper', async () => {
    localStorage.setItem(
      'os:settings',
      JSON.stringify({ state: { wallpaper: 'solid-chalk' }, version: 2 }),
    );
    const { settingsStore } = await import('@/os/kernel/settings');
    expect(settingsStore.getState().wallpaper).toBe('solid-chalk');
  });
});
