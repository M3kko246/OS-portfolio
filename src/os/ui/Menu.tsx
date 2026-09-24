import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { Glyph as GlyphComponent } from '@/os/apps/manifest';
import { playSound } from '@/os/lib/sound';
import { cx, Glyph } from './primitives';

export interface MenuItem {
  id: string;
  label: string;
  glyph?: GlyphComponent;
  separatorBefore?: boolean;
  onSelect: () => void;
}

export type MenuCloseReason = 'escape' | 'select' | 'outside' | 'tab';

interface MenuProps {
  id?: string;
  label: string;
  items: MenuItem[];
  onClose: (reason: MenuCloseReason) => void;
  className?: string;
  /** Viewport position in CSS px; clamped so the menu stays on screen. */
  at?: { x: number; y: number };
  header?: ReactNode;
}

/** ARIA menu: arrows move, Home and End jump, Enter selects, Esc closes, Tab leaves. */
export function Menu({ id, label, items, onClose, className, at, header }: MenuProps) {
  const [active, setActive] = useState(0);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  // Positioned before paint and before the first item takes focus (hidden elements cannot).
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || !at) return;
    const box = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(at.x, window.innerWidth - box.width));
    const y = Math.max(0, Math.min(at.y, window.innerHeight - box.height));
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    el.style.visibility = 'visible';
  }, [at]);

  useEffect(() => {
    itemsRef.current[active]?.focus();
  }, [active]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose('outside');
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [onClose]);

  const onKeyDown = (event: KeyboardEvent) => {
    const last = items.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: active === last ? 0 : active + 1,
      ArrowUp: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    const next = moves[event.key];
    if (next !== undefined) {
      event.preventDefault();
      setActive(next);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose('escape');
    } else if (event.key === 'Tab') {
      onClose('tab');
    }
  };

  return (
    <div ref={rootRef} className={cx('menu px-shell', at && 'menu-floating', className)}>
      {header}
      <ul id={id} role="menu" aria-label={label} className="menu-list" onKeyDown={onKeyDown}>
        {items.map((item, i) => (
          <li key={item.id} role="none" className={cx(item.separatorBefore && 'menu-separator')}>
            <button
              ref={(el) => {
                itemsRef.current[i] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={i === active ? 0 : -1}
              className="menu-item"
              onPointerEnter={() => {
                setActive(i);
              }}
              onClick={() => {
                playSound('click');
                onClose('select');
                item.onSelect();
              }}
            >
              {item.glyph ? <Glyph icon={item.glyph} /> : <span className="icon" />}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
