import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RACK_UNITS, byId, gridRow, nextOf, servers, unitLabel } from '../src/data/servers';

const units = (s: (typeof servers)[number]) =>
  Array.from({ length: s.height }, (_, i) => s.top - i);

const sources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(join(dir, e.name)) : e.name.endsWith('.astro') ? [join(dir, e.name)] : [],
  );

describe('the rack', () => {
  it('gives every server a unique id', () => {
    const ids = servers.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every server inside the rack', () => {
    for (const s of servers) {
      expect(s.height).toBeGreaterThan(0);
      expect(s.top).toBeLessThanOrEqual(RACK_UNITS);
      expect(s.top - s.height + 1).toBeGreaterThanOrEqual(1);
    }
  });

  it('never puts two servers in the same unit', () => {
    const taken = servers.flatMap(units);
    expect(new Set(taken).size).toBe(taken.length);
  });

  it('lists servers from the top of the rack down', () => {
    const tops = servers.map((s) => s.top);
    expect(tops).toEqual([...tops].sort((a, b) => b - a));
  });

  it('gives every server a section on the page', () => {
    const markup = sources('src').map((f) => readFileSync(f, 'utf8')).join('\n');
    const panes = new Set([...markup.matchAll(/<Pane[^>]*\bid="([^"]+)"/g)].map((m) => m[1]));
    expect([...panes].sort()).toEqual(servers.map((s) => s.id).sort());
  });
});

describe('labels', () => {
  it('names the units a server occupies', () => {
    expect(unitLabel(byId('apps'))).toBe('U37-39');
    expect(unitLabel(byId('archive'))).toBe('U2-5');
  });

  it('places a server on the grid counting from the top', () => {
    expect(gridRow(byId('about'))).toBe('1/span 2');
    expect(gridRow(byId('apps'))).toBe('4/span 3');
  });

  it('wraps the next server back to the top', () => {
    expect(nextOf('apps').id).toBe('gauges');
    expect(nextOf(servers.at(-1)!.id).id).toBe(servers[0].id);
  });

  it('refuses an unknown server', () => {
    expect(() => byId('nope')).toThrow();
  });
});
