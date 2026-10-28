import { describe, expect, it } from 'vitest';
import { RACK_UNITS, freeUnits, rackUnits } from '../src/data/rack';
import { services } from '../src/data/projects';

const units = rackUnits(services);
const occupied = (u: { top: number; height: number }) => Array.from({ length: u.height }, (_, i) => u.top - i);

describe('the 3D rack', () => {
  it('holds every service once', () => {
    expect(units.map((u) => u.name).sort()).toEqual(services.map(([n]) => n).sort());
  });

  it('keeps every server inside the rack, none sharing a unit', () => {
    const taken = units.flatMap(occupied);
    expect(new Set(taken).size).toBe(taken.length);
    for (const u of taken) {
      expect(u).toBeGreaterThanOrEqual(1);
      expect(u).toBeLessThanOrEqual(RACK_UNITS);
    }
  });

  it('groups the servers by role, plumbing on top and the apps last', () => {
    const roles = units.map((u) => u.role);
    expect(roles).toEqual([...roles].sort((a, b) => ['plumbing', 'watch', 'app'].indexOf(a) - ['plumbing', 'watch', 'app'].indexOf(b)));
    expect(units.every((u, i) => i === 0 || u.top < units[i - 1].top)).toBe(true);
  });

  it('fills every free unit with a blanking plate, and only free units', () => {
    const taken = new Set(units.flatMap(occupied));
    const free = freeUnits(units);
    expect(free.length + taken.size).toBe(RACK_UNITS);
    for (const u of free) expect(taken.has(u)).toBe(false);
  });
});
