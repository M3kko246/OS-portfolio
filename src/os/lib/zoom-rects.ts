import { reducedMotionNow, STEP_MS } from './motion';

/**
 * The window opening language (PROMPT.md §4.9): four outline rectangles step from the source
 * element to the window, 40 ms each, then the window appears. Only opacity animates; each
 * rectangle has a fixed size and position, so outlines stay 1 unit thick and crisp.
 */
export function zoomRects(layer: HTMLElement | null, from: DOMRect, to: DOMRect): Promise<void> {
  if (!layer || reducedMotionNow() || from.width === 0 || to.width === 0) return Promise.resolve();

  const steps = 4;
  const frames: HTMLElement[] = [];
  const animations: Animation[] = [];
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    const frame = document.createElement('div');
    frame.className = 'zoom-rect';
    frame.style.width = `${Math.round(from.width + (to.width - from.width) * k)}px`;
    frame.style.height = `${Math.round(from.height + (to.height - from.height) * k)}px`;
    frame.style.transform = `translate3d(${Math.round(from.left + (to.left - from.left) * k)}px, ${Math.round(from.top + (to.top - from.top) * k)}px, 0)`;
    layer.append(frame);
    frames.push(frame);
    animations.push(
      frame.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 1,
        delay: (i - 1) * STEP_MS,
        fill: 'forwards',
      }),
    );
  }

  return new Promise((resolve) => {
    window.setTimeout(() => {
      for (const animation of animations) animation.cancel();
      for (const frame of frames) frame.remove();
      resolve();
    }, steps * STEP_MS);
  });
}
