import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { MessageKey } from '@/i18n';
import type { AppId } from '@/os/apps/ids';
import type { SpriteId } from '@/os/apps/manifest';
import { intersects, rectFromPoints, type Point } from '@/os/kernel/geometry';
import {
  cellAt,
  cellRect,
  gridFor,
  nearestFreeCell,
  neighbour,
  placeIcons,
  type Direction,
} from '@/os/kernel/icons';
import { openApp } from '@/os/kernel/launcher';
import { useSession, sessionStore } from '@/os/kernel/session';
import { shellStore } from '@/os/kernel/shell';
import { useWindows } from '@/os/kernel/windows';
import { useT } from '@/os/lib/i18n';
import { useUnit } from '@/os/lib/pixel-scale';
import { cx, Sprite } from '@/os/ui/primitives';
import { useEffectiveWallpaper, Wallpaper } from './Wallpaper';

interface DesktopIconDef {
  id: string;
  appId: AppId;
  labelKey: MessageKey;
  sprite: SpriteId;
}

const ICONS: DesktopIconDef[] = [
  { id: 'readme', appId: 'welcome', labelKey: 'icon.readme', sprite: 'readme' },
  { id: 'career', appId: 'career', labelKey: 'app.career', sprite: 'career' },
  { id: 'explorer', appId: 'explorer', labelKey: 'app.explorer', sprite: 'folder' },
  { id: 'photos', appId: 'photos', labelKey: 'app.photos', sprite: 'photos' },
  { id: 'about', appId: 'about', labelKey: 'app.about', sprite: 'about' },
  { id: 'cv', appId: 'cv', labelKey: 'app.cv', sprite: 'pdf' },
  { id: 'mail', appId: 'mail', labelKey: 'app.mail', sprite: 'mail' },
  { id: 'terminal', appId: 'terminal', labelKey: 'app.terminal', sprite: 'terminal' },
  { id: 'trash', appId: 'trash', labelKey: 'app.trash', sprite: 'trash' },
];
const IDS = ICONS.map((i) => i.id);
const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

interface IconDrag {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  touch: boolean;
  element: HTMLElement;
}

interface Marquee {
  pointerId: number;
  origin: Point;
  base: ReadonlySet<string>;
}

export function Desktop() {
  const t = useT();
  const u = useUnit();
  const area = useWindows((s) => s.area);
  const saved = useSession((s) => s.iconPositions);
  const wallpaper = useEffectiveWallpaper();
  const grid = gridFor(area);
  const cells = useMemo(() => placeIcons(IDS, saved, gridFor(area)), [saved, area]);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [active, setActive] = useState(IDS[0] ?? 'readme');
  const dragRef = useRef<IconDrag | null>(null);
  const marqueeRef = useRef<Marquee | null>(null);
  const marqueeBoxRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef(new Map<string, HTMLElement>());
  const frameRef = useRef(0);

  const open = (def: DesktopIconDef, from: Element | null) => {
    openApp(def.appId, {}, from);
  };

  const focusIcon = (id: string) => {
    setActive(id);
    iconsRef.current.get(id)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = KEY_DIRECTIONS[event.key];
    if (direction) {
      event.preventDefault();
      const next = neighbour(cells, active, direction);
      if (next) {
        focusIcon(next);
        if (!event.ctrlKey) setSelected(new Set([next]));
      }
      return;
    }
    const def = ICONS.find((i) => i.id === active);
    if (!def) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      open(def, iconsRef.current.get(def.id) ?? null);
    } else if (event.key === ' ') {
      event.preventDefault();
      setSelected((s) => {
        const next = new Set(s);
        if (next.has(def.id)) next.delete(def.id);
        else next.add(def.id);
        return next;
      });
    } else if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      const box = iconsRef.current.get(def.id)?.getBoundingClientRect();
      shellStore.getState().setContextMenu({ x: box?.right ?? 0, y: box?.top ?? 0 });
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const target = event.key === 'Home' ? IDS[0] : IDS.at(-1);
      if (target) focusIcon(target);
    }
  };

  const onIconPointerDown = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    setActive(id);
    setSelected((s) => {
      if (event.ctrlKey || event.metaKey) {
        const next = new Set(s);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }
      return s.has(id) ? s : new Set([id]);
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      touch: event.pointerType === 'touch',
      element: event.currentTarget,
    };
  };

  const onIconPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (d?.pointerId !== event.pointerId) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 4 * u) return;
    d.moved = true;
    const cell = cells[d.id];
    if (!cell) return;
    const base = cellRect(cell);
    const x = Math.round(base.x + dx / u) * u;
    const y = Math.round(base.y + dy / u) * u;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      d.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      d.element.classList.add('is-dragging');
    });
  };

  const onIconPointerUp = (event: ReactPointerEvent<HTMLElement>, def: DesktopIconDef) => {
    const d = dragRef.current;
    if (d?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    cancelAnimationFrame(frameRef.current);
    d.element.classList.remove('is-dragging');
    if (!d.moved) {
      // A tap opens on touch screens; mouse users double click.
      if (d.touch) open(def, d.element);
      return;
    }
    const taken = new Set(
      Object.entries(cells)
        .filter(([id]) => id !== d.id)
        .map(([, c]) => `${c.col},${c.row}`),
    );
    const target = nearestFreeCell(cellAt(event.clientX / u, event.clientY / u, grid), taken, grid);
    sessionStore.getState().setIconPosition(d.id, target);
    const rect = cellRect(target);
    d.element.style.transform = `translate3d(${rect.x * u}px, ${rect.y * u}px, 0)`;
  };

  const onSurfacePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    if (!event.ctrlKey && !event.metaKey) setSelected(new Set());
    if (event.pointerType === 'touch') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    marqueeRef.current = {
      pointerId: event.pointerId,
      origin: { x: event.clientX / u, y: event.clientY / u },
      base: event.ctrlKey || event.metaKey ? selected : new Set(),
    };
  };

  const onSurfacePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const m = marqueeRef.current;
    if (m?.pointerId !== event.pointerId) return;
    const box = rectFromPoints(m.origin, { x: event.clientX / u, y: event.clientY / u });
    const hits = new Set(m.base);
    for (const [id, cell] of Object.entries(cells))
      if (intersects(box, cellRect(cell))) hits.add(id);
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const el = marqueeBoxRef.current;
      if (!el) return;
      el.hidden = false;
      el.style.transform = `translate3d(${Math.round(box.x) * u}px, ${Math.round(box.y) * u}px, 0)`;
      el.style.width = `${Math.round(box.w) * u}px`;
      el.style.height = `${Math.round(box.h) * u}px`;
    });
    // Selection only changes when the set of covered icons changes, not on every move.
    setSelected((s) => (s.size === hits.size && [...hits].every((id) => s.has(id)) ? s : hits));
  };

  const onSurfacePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (marqueeRef.current?.pointerId !== event.pointerId) return;
    marqueeRef.current = null;
    cancelAnimationFrame(frameRef.current);
    if (marqueeBoxRef.current) marqueeBoxRef.current.hidden = true;
  };

  const onContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    shellStore.getState().setContextMenu({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className={cx('desktop', `wallpaper-${wallpaper}`)}>
      <Wallpaper />
      <div
        className="desktop-surface"
        role="listbox"
        tabIndex={-1}
        aria-label={t('desktop.label')}
        aria-multiselectable="true"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        onPointerDown={onSurfacePointerDown}
        onPointerMove={onSurfacePointerMove}
        onPointerUp={onSurfacePointerUp}
        onPointerCancel={onSurfacePointerUp}
        onContextMenu={onContextMenu}
      >
        {ICONS.map((def) => {
          const cell = cells[def.id] ?? { col: 0, row: 0 };
          const rect = cellRect(cell);
          return (
            <div
              key={def.id}
              ref={(el) => {
                if (el) iconsRef.current.set(def.id, el);
                else iconsRef.current.delete(def.id);
              }}
              role="option"
              aria-selected={selected.has(def.id)}
              aria-describedby="desktop-hint"
              tabIndex={def.id === active ? 0 : -1}
              data-desktop-focus={def.id === active ? '' : undefined}
              data-icon={def.id}
              className="desktop-icon"
              style={{ transform: `translate3d(${rect.x * u}px, ${rect.y * u}px, 0)` }}
              onPointerDown={(e) => {
                onIconPointerDown(e, def.id);
              }}
              onPointerMove={onIconPointerMove}
              onPointerUp={(e) => {
                onIconPointerUp(e, def);
              }}
              onDoubleClick={(e) => {
                open(def, e.currentTarget);
              }}
              onFocus={() => {
                setActive(def.id);
              }}
            >
              <Sprite id={def.sprite} />
              <span className="desktop-icon-label">{t(def.labelKey)}</span>
            </div>
          );
        })}
        <div ref={marqueeBoxRef} className="marquee" hidden aria-hidden="true" />
      </div>
      <span id="desktop-hint" hidden>
        {t('desktop.openHint')}
      </span>
    </div>
  );
}
