import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sources = ['src/data/projects.ts', 'src/components/Gauges.astro', 'src/components/Ouroboros.astro'];
const icons = sources.flatMap((file) =>
  [...readFileSync(file, 'utf8').matchAll(/['"](\/icons\/[^'"]+)['"]/g)].map((m) => m[1]),
);

describe('project icons', () => {
  it('finds the icons the site refers to', () => {
    expect(icons.length).toBeGreaterThan(0);
  });

  it.each(icons)('%s exists in public', (icon) => {
    expect(existsSync(`public${icon}`)).toBe(true);
  });
});
