import { Close } from 'pixelarticons/react/Close';
import { Copy } from 'pixelarticons/react/Copy';
import { Minus } from 'pixelarticons/react/Minus';
import { Square } from 'pixelarticons/react/Square';
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { manifests } from '@/os/apps/registry';
import {
  clampRect,
  layoutForSide,
  layoutRect,
  resizeRect,
  snapSideAt,
  type Edge,
  type Rect,
  type Size,
  type SnapSide,
} from '@/os/kernel/geometry';
import { closeWindow, takeOpenRect, windowTitle } from '@/os/kernel/launcher';
import { windowStore, type WindowState } from '@/os/kernel/windows';
import { useT } from '@/os/lib/i18n';
import { useUnit } from '@/os/lib/pixel-scale';
import { zoomRects } from '@/os/lib/zoom-rects';
import { cx, Glyph } from '@/os/ui/primitives';
import { AppFrame } from './AppFrame';
import { showSnapPreview, zoomLayer } from './layers';

const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  start: Rect;
  current: Rect;
  moved: boolean;
  side: SnapSide | null;
  edge: Edge | null;
}

function taskbarButton(id: string): Element | null {
  return document.querySelector(`[data-taskbar-window="${CSS.escape(id)}"]`);
}

interface WindowProps {
  win: WindowState;
  z: number;
  focused: boolean;
  area: Size;
}

export function Window({ win, z, focused, area }: WindowProps) {
  const t = useT();
  const u = useUnit();
  const manifest = manifests[win.appId];
  const ref = useRef<HTMLElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const frameRef = useRef(0);
  const titleId = useId();
  const [revealed, setRevealed] = useState(false);
  const rect = layoutRect(win.layout, win.rect, area);
  const title = windowTitle(win.appId, win.params);
  const store = windowStore.getState;

  // Four outline rectangles from the opener to the window, then the window appears.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const from = takeOpenRect(win.id);
    const run = from ? zoomRects(zoomLayer(), from, el.getBoundingClientRect()) : Promise.resolve();
    void run.then(() => {
      if (!cancelled) setRevealed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [win.id]);

  // Once visible, focus moves to the first useful control, or to the window itself.
  useEffect(() => {
    if (!revealed) return;
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>(
      '.window-body :is([data-autofocus], a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex="0"])',
    );
    (first ?? el)?.focus();
  }, [revealed]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const apply = (r: Rect) => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `translate3d(${r.x * u}px, ${r.y * u}px, 0)`;
    el.style.width = `${r.w * u}px`;
    el.style.height = `${r.h * u}px`;
  };

  const begin = (event: ReactPointerEvent<HTMLElement>, edge: Edge | null) => {
    if (event.button !== 0) return;
    if (!edge && (event.target as Element).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      start: rect,
      current: rect,
      moved: false,
      side: null,
      edge,
    };
  };

  const move = (event: ReactPointerEvent<HTMLElement>) => {
    const g = gestureRef.current;
    if (g?.pointerId !== event.pointerId) return;
    let dx = Math.round((event.clientX - g.startX) / u);
    let dy = Math.round((event.clientY - g.startY) / u);
    if (!g.moved) {
      if (Math.abs(dx) + Math.abs(dy) < 3) return;
      g.moved = true;
      // Dragging a maximized or snapped window restores it under the pointer.
      if (!g.edge && win.layout !== 'normal') {
        const ratio = (event.clientX / u - g.start.x) / g.start.w;
        g.start = {
          x: Math.round(event.clientX / u - win.rect.w * ratio),
          y: g.start.y,
          w: win.rect.w,
          h: win.rect.h,
        };
        g.startX = event.clientX;
        g.startY = event.clientY;
        dx = 0;
        dy = 0;
      }
    }
    if (g.edge) {
      g.current = resizeRect(g.start, g.edge, dx, dy, win.min, area);
    } else {
      g.current = clampRect({ ...g.start, x: g.start.x + dx, y: g.start.y + dy }, area, win.min);
      g.side = snapSideAt({ x: event.clientX / u, y: event.clientY / u }, area);
    }
    const next = g.current;
    const side = g.side;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      apply(next);
      showSnapPreview(side ? layoutRect(layoutForSide(side), next, area) : null, u);
    });
  };

  const end = (event: ReactPointerEvent<HTMLElement>) => {
    const g = gestureRef.current;
    if (g?.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    cancelAnimationFrame(frameRef.current);
    showSnapPreview(null, u);
    if (!g.moved) return;
    store().setRect(win.id, g.current);
    if (g.side) store().snap(win.id, g.side);
  };

  const animateToTaskbar = () => {
    const el = ref.current;
    const target = taskbarButton(win.id);
    if (el && target)
      void zoomRects(zoomLayer(), el.getBoundingClientRect(), target.getBoundingClientRect());
  };

  const maximized = win.layout === 'maximized';

  return (
    <section
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      hidden={win.minimized}
      data-window-id={win.id}
      className={cx('window px-shell', focused && 'is-focused', !revealed && 'is-hidden')}
      style={{
        transform: `translate3d(${rect.x * u}px, ${rect.y * u}px, 0)`,
        width: `${rect.w * u}px`,
        height: `${rect.h * u}px`,
        zIndex: z,
      }}
      onPointerDownCapture={() => {
        if (!focused) store().focus(win.id);
      }}
      onFocusCapture={() => {
        if (!focused) store().focus(win.id);
      }}
    >
      <header
        className="window-titlebar"
        onPointerDown={(e) => {
          begin(e, null);
        }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onDoubleClick={(e) => {
          if (!(e.target as Element).closest('button')) store().toggleMaximize(win.id);
        }}
      >
        <Glyph icon={manifest.glyph} />
        <h2 id={titleId} className="window-title">
          {title}
        </h2>
        <div className="window-controls">
          <button
            type="button"
            className="window-control"
            aria-label={t('window.minimize')}
            onClick={() => {
              animateToTaskbar();
              store().minimize(win.id);
            }}
          >
            <Glyph icon={Minus} />
          </button>
          <button
            type="button"
            className="window-control"
            aria-label={maximized ? t('window.restore') : t('window.maximize')}
            onClick={() => {
              store().toggleMaximize(win.id);
            }}
          >
            <Glyph icon={maximized ? Copy : Square} />
          </button>
          <button
            type="button"
            className="window-control"
            aria-label={t('window.close')}
            onClick={() => {
              animateToTaskbar();
              closeWindow(win);
            }}
          >
            <Glyph icon={Close} />
          </button>
        </div>
      </header>
      <div className="window-body px-well">
        <AppFrame win={win} />
      </div>
      {win.layout === 'normal' &&
        EDGES.map((edge) => (
          <div
            key={edge}
            className={`resize-handle resize-${edge}`}
            aria-hidden="true"
            onPointerDown={(e) => {
              begin(e, edge);
            }}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
        ))}
    </section>
  );
}
