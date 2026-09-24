import { describe, expect, it } from 'vitest';
import { cellAt, gridFor, nearestFreeCell, neighbour, placeIcons } from '@/os/kernel/icons';

const ids = ['readme', 'career', 'explorer', 'photos', 'about', 'cv', 'mail', 'terminal', 'trash'];
const grid = { cols: 12, rows: 8 };

describe('desktop icons', () => {
  it('fills the first column top to bottom and puts the trash bottom-right', () => {
    const cells = placeIcons(ids, {}, grid);
    expect(cells.readme).toEqual({ col: 0, row: 0 });
    expect(cells.terminal).toEqual({ col: 0, row: 7 });
    expect(cells.trash).toEqual({ col: 11, row: 7 });
  });

  it('wraps to the next column on short screens', () => {
    const cells = placeIcons(ids, {}, { cols: 10, rows: 5 });
    expect(cells.cv).toEqual({ col: 1, row: 0 });
  });

  it('keeps saved positions and resolves collisions and cells outside the grid', () => {
    const cells = placeIcons(
      ids,
      { career: { col: 5, row: 3 }, photos: { col: 5, row: 3 }, mail: { col: 40, row: 2 } },
      grid,
    );
    expect(cells.career).toEqual({ col: 5, row: 3 });
    expect(cells.photos).not.toEqual({ col: 5, row: 3 });
    const all = Object.values(cells).map((c) => `${c.col},${c.row}`);
    expect(new Set(all).size).toBe(ids.length);
    for (const cell of Object.values(cells)) {
      expect(cell.col).toBeLessThan(grid.cols);
      expect(cell.row).toBeLessThan(grid.rows);
    }
  });

  it('finds the nearest free cell', () => {
    expect(nearestFreeCell({ col: 0, row: 0 }, new Set(['0,0']), grid)).toEqual({ col: 0, row: 1 });
    expect(nearestFreeCell({ col: 99, row: 99 }, new Set(), grid)).toEqual({ col: 11, row: 7 });
  });

  it('moves the keyboard focus to the nearest icon in each direction', () => {
    const cells = placeIcons(ids, {}, grid);
    expect(neighbour(cells, 'readme', 'down')).toBe('career');
    expect(neighbour(cells, 'career', 'up')).toBe('readme');
    expect(neighbour(cells, 'readme', 'up')).toBeNull();
    expect(neighbour(cells, 'terminal', 'right')).toBe('trash');
  });

  it('maps pointer positions to cells', () => {
    expect(cellAt(0, 0, grid)).toEqual({ col: 0, row: 0 });
    expect(cellAt(8 + 80 * 3 + 5, 8 + 76 * 2 + 5, grid)).toEqual({ col: 3, row: 2 });
    expect(gridFor({ w: 1000, h: 620 })).toEqual({ cols: 12, rows: 8 });
  });
});
