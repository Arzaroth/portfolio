import { describe, expect, it } from 'vitest';
import { tile, type Rect } from '../src/scripts/tile';
import { leaves, workspaces } from '../src/data/desktop';

const area: Rect = { x: 12, y: 62, w: 1416, h: 826 };
const right = (r: Rect) => r.x + r.w;
const bottom = (r: Rect) => r.y + r.h;
const apart = (a: Rect, b: Rect) => right(a) <= b.x || right(b) <= a.x || bottom(a) <= b.y || bottom(b) <= a.y;

describe('tiling', () => {
  for (const ws of workspaces) {
    it(`fills the ${ws.label} desk without overlap`, () => {
      const rects = [...tile(ws.tree, area, 12).values()];
      expect(rects).toHaveLength(leaves(ws.tree).length);
      rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => expect(apart(a, b)).toBe(true)));
      const used = rects.reduce((sum, r) => sum + r.w * r.h, 0);
      expect(used).toBeLessThan(area.w * area.h);
      expect(Math.min(...rects.map((r) => r.x))).toBe(area.x);
      expect(Math.max(...rects.map(right))).toBe(right(area));
      expect(Math.min(...rects.map((r) => r.y))).toBe(area.y);
      expect(Math.max(...rects.map(bottom))).toBe(bottom(area));
    });
  }

  it('leaves the gap between two tiles', () => {
    const r = tile(['v', 0.5, 0, 1], { x: 0, y: 0, w: 212, h: 100 }, 12);
    expect(r.get(1)!.x - right(r.get(0)!)).toBe(12);
  });

  it('puts every edge on the device pixel grid', () => {
    const dpr = 1.25;
    const snap = (v: number) => Math.round(v * dpr) / dpr;
    const onGrid = (v: number) => Math.abs(v * dpr - Math.round(v * dpr)) < 1e-9;
    for (const ws of workspaces) {
      for (const r of tile(ws.tree, { x: 12.3, y: 62.1, w: 1001.7, h: 655.5 }, snap(12), snap).values()) {
        for (const edge of [r.x, r.y, right(r), bottom(r)]) expect(onGrid(edge)).toBe(true);
      }
    }
  });

  it('gives a hidden window\'s share of a split to its neighbour', () => {
    const tree = ['v', 0.5, 0, ['h', 0.5, 1, 2]] as const;
    const all = tile(tree as never, area, 12);
    const two = tile(tree as never, area, 12, Math.round, (p) => p < 2);
    expect([...two.keys()].sort()).toEqual([0, 1]);
    expect(two.get(0)).toEqual(all.get(0));
    expect(two.get(1)).toEqual({ x: all.get(1)!.x, y: area.y, w: all.get(1)!.w, h: area.h });
  });

  it('lets a window shown alone fill the desk', () => {
    for (const ws of workspaces) {
      const one = tile(ws.tree, area, 12, Math.round, (p) => p === 0);
      expect([...one.values()]).toEqual([area]);
    }
  });
});
