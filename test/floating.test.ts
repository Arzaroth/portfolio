import { describe, expect, it } from 'vitest';
import { burst, step, type Body } from '../src/scripts/floating';

const W = 1416;
const H = 826;
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const tiles = [
  { x: 0, y: 0, w: 620, h: 826 },
  { x: 632, y: 0, w: 784, h: 380 },
  { x: 632, y: 392, w: 386, h: 434 },
  { x: 1030, y: 392, w: 386, h: 434 },
];
const run = (bodies: Body[], seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) step(bodies, 1 / 60, W, H);
};

describe('floating windows', () => {
  it('shrink to a floating size and fly upwards, away from the middle', () => {
    const bodies = burst(tiles, W, H, seeded(7));
    for (const [i, b] of bodies.entries()) {
      expect(b.w).toBeLessThanOrEqual(tiles[i].w);
      expect(b.h).toBeLessThanOrEqual(tiles[i].h);
      expect(b.vy).toBeLessThan(0);
      expect(Math.sign(b.vx)).toBe(Math.sign(b.x + b.w / 2 - W / 2));
    }
  });

  it('stay inside the desk while they fly', () => {
    const bodies = burst(tiles, W, H, seeded(11));
    for (let i = 0; i < 300; i++) {
      step(bodies, 1 / 60, W, H);
      for (const b of bodies) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(W + 1e-6);
        expect(b.y + b.h).toBeLessThanOrEqual(H + 1e-6);
      }
    }
  });

  it('settle flat on the floor', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const bodies = burst(tiles, W, H, seeded(seed));
      run(bodies, 4);
      for (const b of bodies) {
        expect(b.vy).toBe(0);
        expect(b.y + b.h).toBeCloseTo(H);
        expect(Math.abs(b.a)).toBeLessThan(0.5);
      }
    }
  });

  it('leave a window alone while it is held', () => {
    const bodies = burst(tiles, W, H, seeded(3));
    bodies[0].held = true;
    const { x, y } = bodies[0];
    run(bodies, 1);
    expect([bodies[0].x, bodies[0].y]).toEqual([x, y]);
  });
});
