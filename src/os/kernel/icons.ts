import type { Rect, Size } from './geometry';
import type { Cell } from './session';

/** Desktop grid cell in art pixels, and the margin around the grid. */
export const ICON_CELL: Size = { w: 80, h: 76 };
export const ICON_MARGIN = 8;

export interface Grid {
  cols: number;
  rows: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export function gridFor(area: Size): Grid {
  return {
    cols: Math.max(1, Math.floor((area.w - ICON_MARGIN) / ICON_CELL.w)),
    rows: Math.max(1, Math.floor((area.h - ICON_MARGIN) / ICON_CELL.h)),
  };
}

const key = (c: Cell) => `${c.col},${c.row}`;
const fits = (c: Cell, grid: Grid) =>
  c.col >= 0 && c.row >= 0 && c.col < grid.cols && c.row < grid.rows;

/** Closest free cell to `target` (Chebyshev rings), or the target itself if it is free. */
export function nearestFreeCell(target: Cell, taken: ReadonlySet<string>, grid: Grid): Cell {
  const clamped = {
    col: Math.min(Math.max(0, target.col), grid.cols - 1),
    row: Math.min(Math.max(0, target.row), grid.rows - 1),
  };
  const maxRing = Math.max(grid.cols, grid.rows);
  for (let ring = 0; ring <= maxRing; ring++) {
    for (let dc = -ring; dc <= ring; dc++) {
      for (let dr = -ring; dr <= ring; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
        const cell = { col: clamped.col + dc, row: clamped.row + dr };
        if (fits(cell, grid) && !taken.has(key(cell))) return cell;
      }
    }
  }
  return clamped;
}

/**
 * Where every icon sits: saved positions first (if they still fit), then the trash in the
 * bottom-right corner, then everything else top to bottom, left to right.
 */
export function placeIcons(
  ids: readonly string[],
  saved: Readonly<Record<string, Cell>>,
  grid: Grid,
  cornerId = 'trash',
): Record<string, Cell> {
  const taken = new Set<string>();
  const out: Record<string, Cell> = {};
  const take = (id: string, cell: Cell) => {
    out[id] = cell;
    taken.add(key(cell));
  };

  for (const id of ids) {
    const cell = saved[id];
    if (cell && fits(cell, grid) && !taken.has(key(cell))) take(id, cell);
  }
  if (ids.includes(cornerId) && !out[cornerId]) {
    take(cornerId, nearestFreeCell({ col: grid.cols - 1, row: grid.rows - 1 }, taken, grid));
  }
  let cursor = 0;
  for (const id of ids) {
    if (out[id]) continue;
    let placed = false;
    while (!placed && cursor < grid.cols * grid.rows) {
      const cell = { col: Math.floor(cursor / grid.rows), row: cursor % grid.rows };
      cursor++;
      if (!taken.has(key(cell))) {
        take(id, cell);
        placed = true;
      }
    }
    if (!placed) take(id, nearestFreeCell({ col: 0, row: 0 }, taken, grid));
  }
  return out;
}

export function cellRect(cell: Cell): Rect {
  return {
    x: ICON_MARGIN + cell.col * ICON_CELL.w,
    y: ICON_MARGIN + cell.row * ICON_CELL.h,
    w: ICON_CELL.w,
    h: ICON_CELL.h,
  };
}

export function cellAt(x: number, y: number, grid: Grid): Cell {
  return {
    col: Math.min(grid.cols - 1, Math.max(0, Math.floor((x - ICON_MARGIN) / ICON_CELL.w))),
    row: Math.min(grid.rows - 1, Math.max(0, Math.floor((y - ICON_MARGIN) / ICON_CELL.h))),
  };
}

/** Keyboard neighbour: the nearest icon in the given direction, favouring the same row/column. */
export function neighbour(
  cells: Readonly<Record<string, Cell>>,
  from: string,
  direction: Direction,
): string | null {
  const origin = cells[from];
  if (!origin) return null;
  let best: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const [id, cell] of Object.entries(cells)) {
    if (id === from) continue;
    const dc = cell.col - origin.col;
    const dr = cell.row - origin.row;
    const [main, cross] =
      direction === 'down'
        ? [dr, dc]
        : direction === 'up'
          ? [-dr, dc]
          : direction === 'right'
            ? [dc, dr]
            : [-dc, dr];
    if (main <= 0) continue;
    const score = main + Math.abs(cross) * 4;
    if (score < bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}
