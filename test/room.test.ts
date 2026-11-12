import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RACK_UNITS, cardOf, cards, colors, labelOf, pickable, rack, slotOf } from '../src/data/room';

describe('the room', () => {
  it('fills the rack exactly, top to bottom, with no unit shared', () => {
    expect(rack.reduce((n, s) => n + s.height, 0)).toBe(RACK_UNITS);
    expect(rack[0].top).toBe(RACK_UNITS);
    expect(rack.at(-1)!.bottom).toBe(1);
    rack.forEach((s, i) => i > 0 && expect(s.top).toBe(rack[i - 1].bottom - 1));
  });

  it('gives each server one id', () => {
    expect(new Set(rack.map((s) => s.id)).size).toBe(rack.length);
  });

  it('lets every server but the switch and the brush panel be pulled out, plus the plant and the cat', () => {
    expect(pickable).not.toContain('switch');
    expect(pickable).not.toContain('brush');
    expect(pickable.slice(-2)).toEqual(['poucevert', 'cat']);
    expect(pickable).toHaveLength(rack.length);
  });

  it.each(pickable)('has a card, a colour and a label for %s', (id) => {
    const card = cardOf(id);
    expect(card.name.length).toBeGreaterThan(0);
    expect(card.paragraphs.length + (card.rows?.length ?? 0)).toBeGreaterThan(0);
    expect(colors[id]).toMatch(/^#[0-9a-f]{6}$/);
    expect(labelOf(id)).toBeTruthy();
  });

  it.each(cards.filter((c) => c.icon))('finds the icon of $id in public', (card) => {
    expect(existsSync(`public${card.icon}`)).toBe(true);
  });

  it('names slots the way a rack does', () => {
    expect(slotOf(rack.find((s) => s.id === 'ups')!)).toBe('U1-4');
    expect(slotOf(rack.find((s) => s.id === 'smith')!)).toBe('U38');
  });
});
