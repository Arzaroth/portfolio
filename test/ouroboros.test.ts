import { describe, expect, it } from 'vitest';
import { parseLoc } from '../src/scripts/ouroboros';

describe('the ouroboros release notes', () => {
  it('give their line count on the LOC line', () => {
    expect(parseLoc('Nothing left that nobody reads\n\nSome prose.\n\nLOC: 27759\n')).toBe(27759);
  });

  it('are read with Windows line endings too', () => {
    expect(parseLoc('Prose.\r\n\r\nLOC: 27759\r\n')).toBe(27759);
  });

  it('count for nothing without a LOC line', () => {
    expect(parseLoc('A release that forgot to say.')).toBeUndefined();
  });

  it('do not take a LOC mentioned in passing', () => {
    expect(parseLoc('The LOC: 12 figure from last time was wrong.')).toBeUndefined();
  });
});
