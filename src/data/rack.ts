import type { Role } from './projects';

export const RACK_UNITS = 42;

export interface Unit {
  name: string;
  role: Role;
  top: number;
  height: number;
}

const order: Role[] = ['plumbing', 'watch', 'app'];
const heightOf: Record<Role, number> = { plumbing: 1, watch: 1, app: 2 };

export function rackUnits(services: [string, Role][]): Unit[] {
  const units: Unit[] = [];
  let top = RACK_UNITS - 1;
  for (const role of order) {
    const mine = services.filter(([, r]) => r === role);
    if (!mine.length) continue;
    for (const [name] of mine) {
      units.push({ name, role, top, height: heightOf[role] });
      top -= heightOf[role];
    }
    top -= 1;
  }
  return units;
}

export function freeUnits(units: Unit[]): number[] {
  const taken = new Set(units.flatMap((u) => Array.from({ length: u.height }, (_, i) => u.top - i)));
  return Array.from({ length: RACK_UNITS }, (_, i) => RACK_UNITS - i).filter((u) => !taken.has(u));
}
