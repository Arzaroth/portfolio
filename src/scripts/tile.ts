import type { Tree } from '../data/desktop';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function tile(tree: Tree, area: Rect, gap: number, snap: (v: number) => number = Math.round): Map<number, Rect> {
  const out = new Map<number, Rect>();
  const place = (node: Tree, x0: number, y0: number, x1: number, y1: number) => {
    if (typeof node === 'number') {
      out.set(node, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
      return;
    }
    const [dir, ratio, a, b] = node;
    if (dir === 'v') {
      const cut = snap(x0 + (x1 - x0 - gap) * ratio);
      place(a, x0, y0, cut, y1);
      place(b, cut + gap, y0, x1, y1);
    } else {
      const cut = snap(y0 + (y1 - y0 - gap) * ratio);
      place(a, x0, y0, x1, cut);
      place(b, x0, cut + gap, x1, y1);
    }
  };
  place(tree, snap(area.x), snap(area.y), snap(area.x + area.w), snap(area.y + area.h));
  return out;
}
