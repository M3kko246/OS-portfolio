import type { StateStorage } from 'zustand/middleware';

/**
 * localStorage behind try/catch: private browsing, blocked site data or a full quota must never
 * break the system. Without storage the OS still works, it just forgets on reload.
 */
const memory = new Map<string, string>();

export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      memory.set(name, value);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      memory.delete(name);
    }
  },
};

/** Per-tab flags (first boot of the session, visit counted). */
export function sessionFlag(name: string): boolean {
  try {
    return sessionStorage.getItem(name) === '1';
  } catch {
    return memory.get(`session:${name}`) === '1';
  }
}

export function setSessionFlag(name: string): void {
  try {
    sessionStorage.setItem(name, '1');
  } catch {
    memory.set(`session:${name}`, '1');
  }
}
