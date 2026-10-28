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

  it('fit on the number keys, 0 included', () => {
    expect(workspaces.length).toBeLessThanOrEqual(10);
  });

  for (const ws of workspaces) {
    it(`number the windows of ${ws.label} from 0, each once, in one component`, () => {
      const placed = leaves(ws.tree).sort((a, b) => a - b);
      expect(placed).toEqual(placed.map((_, i) => i));
      expect(sources.filter((s) => s.includes(`<Workspace id="${ws.id}">`))).toHaveLength(1);
    });
  }
});
