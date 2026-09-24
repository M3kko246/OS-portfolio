import type { Rect } from '@/os/kernel/geometry';

/**
 * Shared overlay elements driven imperatively during gestures, so pointer moves never go
 * through React state.
 */
let snapPreview: HTMLElement | null = null;
let zoom: HTMLElement | null = null;

export function registerSnapPreview(element: HTMLElement | null): void {
  snapPreview = element;
}

export function registerZoomLayer(element: HTMLElement | null): void {
  zoom = element;
}

export function zoomLayer(): HTMLElement | null {
  return zoom;
}

export function showSnapPreview(rect: Rect | null, unit: number): void {
  if (!snapPreview) return;
  if (!rect) {
    snapPreview.hidden = true;
    return;
  }
  snapPreview.hidden = false;
  snapPreview.style.transform = `translate3d(${rect.x * unit}px, ${rect.y * unit}px, 0)`;
  snapPreview.style.width = `${rect.w * unit}px`;
  snapPreview.style.height = `${rect.h * unit}px`;
}
