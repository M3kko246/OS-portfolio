import { describe, expect, it } from 'vitest';
import type { AppId } from '@/os/apps/ids';
import { isInside, layoutRect } from '@/os/kernel/geometry';
import { createWindowStore, type OpenSpec, type WindowStoreApi } from '@/os/kernel/windows';

const spec = (appId: AppId, extra: Partial<OpenSpec> = {}): OpenSpec => ({
  appId,
  title: appId,
  singleton: true,
  size: { w: 400, h: 300 },
  min: { w: 200, h: 150 },
  ...extra,
});

function expectInvariants(store: WindowStoreApi) {
  const { windows, order, focusedId, area } = store.getState();
  expect(new Set(order).size).toBe(order.length);
  expect([...order].sort()).toEqual(Object.keys(windows).sort());
  if (focusedId !== null) {
    expect(windows[focusedId]).toBeDefined();
    expect(windows[focusedId]?.minimized).toBe(false);
  }
  for (const win of Object.values(windows)) {
    expect(isInside(layoutRect(win.layout, win.rect, area), area)).toBe(true);
  }
}

describe('window store', () => {
  it('reopening a singleton focuses it instead of duplicating it', () => {
    const store = createWindowStore();
    const a = store.getState().open(spec('about'));
    store.getState().open(spec('settings'));
    const again = store.getState().open(spec('about'));
    expect(again).toBe(a);
    expect(store.getState().order).toEqual(['settings', 'about']);
    expect(store.getState().focusedId).toBe('about');
  });

  it('gives each project its own window', () => {
    const store = createWindowStore();
    const one = store.getState().open(spec('project', { singleton: false, key: 'uno' }));
    const two = store.getState().open(spec('project', { singleton: false, key: 'due' }));
    expect(one).toBe('project:uno');
    expect(two).toBe('project:due');
    expect(store.getState().open(spec('project', { singleton: false, key: 'uno' }))).toBe(one);
    expect(store.getState().order).toHaveLength(2);
  });

  it('moves focus to the top-most visible window on close and minimize', () => {
    const store = createWindowStore();
    const { open } = store.getState();
    open(spec('about'));
    open(spec('settings'));
    open(spec('mail'));
    store.getState().minimize('mail');
    expect(store.getState().focusedId).toBe('settings');
    store.getState().close('settings');
    expect(store.getState().focusedId).toBe('about');
    store.getState().focus('mail');
    expect(store.getState().windows.mail?.minimized).toBe(false);
    expect(store.getState().order.at(-1)).toBe('mail');
  });

  it('keeps rects inside a shrinking area', () => {
    const store = createWindowStore({ w: 1200, h: 800 });
    const id = store.getState().open(spec('about'));
    store.getState().setRect(id, { x: 900, y: 600, w: 300, h: 200 });
    store.getState().setArea({ w: 800, h: 500 });
    expectInvariants(store);
  });

  it('holds its invariants across a random sequence of operations', () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const apps: AppId[] = ['about', 'settings', 'mail', 'terminal', 'photos'];
    const store = createWindowStore({ w: 1000, h: 640 });
    for (let step = 0; step < 500; step++) {
      const state = store.getState();
      const ids = state.order;
      const pick = ids[Math.floor(random() * ids.length)];
      const app = apps[Math.floor(random() * apps.length)] ?? 'about';
      switch (Math.floor(random() * 8)) {
        case 0:
          state.open(spec(app));
          break;
        case 1:
          if (pick) state.close(pick);
          break;
        case 2:
          if (pick) state.focus(pick);
          break;
        case 3:
          if (pick) state.minimize(pick);
          break;
        case 4:
          if (pick) state.toggleMaximize(pick);
          break;
        case 5:
          if (pick) state.snap(pick, (['left', 'right', 'top', null] as const)[step % 4] ?? null);
          break;
        case 6:
          if (pick)
            state.setRect(pick, {
              x: random() * 1400 - 200,
              y: random() * 900 - 200,
              w: random() * 1200,
              h: random() * 900,
            });
          break;
        case 7:
          state.setArea({
            w: 400 + Math.floor(random() * 1200),
            h: 300 + Math.floor(random() * 700),
          });
          break;
      }
      expectInvariants(store);
    }
  });
});
