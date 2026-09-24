import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { GameEngine } from '@/game/engine';
import { applyStick } from '@/game/logic/input';

/**
 * Touch controls (PROMPT.md §2.8): a virtual joystick at the bottom left and an action button
 * at the bottom right. The knob moves through a ref and a transform, never through React state,
 * so dragging it does not re-render anything.
 */
export function TouchControls({
  engine,
  actionLabel,
  onAction,
}: {
  engine: GameEngine;
  actionLabel: string;
  onAction: () => void;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number | null>(null);

  const moveKnob = (event: ReactPointerEvent<HTMLDivElement>) => {
    const base = baseRef.current;
    if (!base || pointerRef.current !== event.pointerId) return;
    const box = base.getBoundingClientRect();
    const radius = box.width / 2;
    const x = (event.clientX - (box.left + radius)) / radius;
    const y = (event.clientY - (box.top + radius)) / radius;
    applyStick(engine.input, x, y);
    const length = Math.max(1, Math.hypot(x, y));
    const knob = knobRef.current;
    if (knob) {
      const travel = radius * 0.6;
      knob.style.transform = `translate(${String(Math.round((x / length) * travel))}px, ${String(Math.round((y / length) * travel))}px)`;
    }
  };

  const release = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    applyStick(engine.input, 0, 0);
    if (knobRef.current) knobRef.current.style.transform = '';
  };

  return (
    <>
      {/* The keyboard and the Map do the same: this pad only exists for fingers. */}
      <div
        ref={baseRef}
        className="touch-joystick"
        aria-hidden="true"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointerRef.current = event.pointerId;
          moveKnob(event);
        }}
        onPointerMove={moveKnob}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div ref={knobRef} className="touch-knob" />
      </div>
      <button type="button" className="px-btn px-btn-primary touch-action" onClick={onAction}>
        {actionLabel}
      </button>
    </>
  );
}
