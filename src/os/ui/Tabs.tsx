import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './primitives';

export interface TabDef {
  id: string;
  label: string;
  render: () => ReactNode;
}

/** ARIA tabs with automatic activation: arrows, Home and End move between tabs. */
export function Tabs({ label, tabs }: { label: string; tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? '');
  const baseId = useId();
  const tabsRef = useRef(new Map<string, HTMLButtonElement>());
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === active),
  );
  const current = tabs[index];

  const onKeyDown = (event: KeyboardEvent) => {
    const last = tabs.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = tabs[moves[event.key] ?? -1];
    if (!next) return;
    event.preventDefault();
    setActive(next.id);
    tabsRef.current.get(next.id)?.focus();
  };

  return (
    <div className="tabs">
      <div role="tablist" aria-label={label} className="tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabsRef.current.set(tab.id, el);
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={tab.id === current?.id}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={tab.id === current?.id ? 0 : -1}
            className={cx('tab', tab.id === current?.id && 'is-active')}
            onKeyDown={onKeyDown}
            onClick={() => {
              setActive(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {current && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${current.id}`}
          aria-labelledby={`${baseId}-tab-${current.id}`}
          tabIndex={0}
          className="tab-panel"
        >
          {current.render()}
        </div>
      )}
    </div>
  );
}
