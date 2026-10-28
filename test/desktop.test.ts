import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { leaves, workspaces } from '../src/data/desktop';

const dir = 'src/components';
const sources = readdirSync(dir).map((f) => readFileSync(join(dir, f), 'utf8'));

describe('the workspaces', () => {
  it('have unique ids and aliases', () => {
    const names = workspaces.flatMap((w) => [w.id, ...(w.aliases ?? [])]);
    expect(new Set(names).size).toBe(names.length);
  });

  it('fit on the number keys', () => {
    expect(workspaces.length).toBeLessThanOrEqual(9);
  });

  for (const ws of workspaces) {
    it(`place each window of ${ws.label} exactly once`, () => {
      const placed = leaves(ws.tree).sort((a, b) => a - b);
      expect(placed).toEqual(placed.map((_, i) => i));
      const src = sources.filter((s) => s.includes(`<Workspace id="${ws.id}">`));
      expect(src).toHaveLength(1);
      expect(src[0].match(/<Window\b/g)).toHaveLength(placed.length);
    });
  }
});
