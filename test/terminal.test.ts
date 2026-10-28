import { describe, expect, it } from 'vitest';
import { complete, run } from '../src/scripts/terminal';

const programs = ['tokengauge', 'tailgauge'];

describe('the terminal', () => {
  it('runs a program it knows', () => {
    expect(run('tokengauge', programs)).toMatchObject({ kind: 'out', ok: true, known: 'tokengauge' });
  });

  it('ignores the arguments when it picks a program', () => {
    expect(run('  tailgauge --status ', programs)).toMatchObject({ cmd: 'tailgauge --status', known: 'tailgauge' });
  });

  it('says so, like zsh, for a program it does not know', () => {
    expect(run('rm -rf /', programs)).toEqual({ kind: 'out', cmd: 'rm -rf /', html: 'zsh: command not found: rm', ok: false });
  });

  it('escapes what was typed', () => {
    const res = run('<img>', programs);
    expect(res.kind === 'out' && res.html).toBe('zsh: command not found: &lt;img&gt;');
  });

  it('lists what it knows on help', () => {
    const res = run('help', programs);
    expect(res.kind === 'out' && res.html).toContain('tokengauge, tailgauge');
  });

  it('clears', () => {
    expect(run('clear', programs)).toEqual({ kind: 'clear' });
  });

  it('completes a name only when one program matches', () => {
    expect(complete('tok', programs)).toBe('tokengauge');
    expect(complete('t', programs)).toBeUndefined();
    expect(complete('', programs)).toBeUndefined();
  });
});
