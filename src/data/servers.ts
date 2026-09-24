export type Color = 'cyan' | 'blue' | 'yellow' | 'green' | 'red' | 'magenta' | 'orange' | 'grey';

export interface Server {
  id: string;
  name: string;
  top: number;
  height: number;
  color: Color;
  ports: number;
  blurb: string;
  oldLed?: boolean;
}

export const RACK_UNITS = 42;

export const servers: Server[] = [
  { id: 'about', name: 'Hello', top: 42, height: 2, color: 'cyan', ports: 2, blurb: '' },
  { id: 'apps', name: 'Apps', top: 39, height: 3, color: 'blue', ports: 4, blurb: 'Nostragoalus, La Coincherie, Yaek, c2c-conv' },
  { id: 'gauges', name: 'Gauges', top: 35, height: 2, color: 'yellow', ports: 3, blurb: 'Desktop panels and the crate they share' },
  { id: 'workshop', name: 'Workbench', top: 32, height: 2, color: 'green', ports: 3, blurb: 'Tacite, Pouce Vert, Sheaf' },
  { id: 'ouroboros', name: 'ouroboros', top: 29, height: 4, color: 'red', ports: 6, blurb: 'Eight lines of Python that kept growing' },
  { id: 'selfhosted', name: 'Self-hosting', top: 23, height: 3, color: 'magenta', ports: 4, blurb: 'What runs on the rack' },
  { id: 'contributions', name: 'Contributions', top: 18, height: 2, color: 'orange', ports: 2, blurb: "A friend's projects, and patches sent upstream" },
  { id: 'archive', name: 'Early years', top: 5, height: 4, color: 'grey', ports: 3, blurb: '2014 onwards, ponies included', oldLed: true },
];

export const colorVar = (c: Color) => `var(--c-${c})`;

export const unitLabel = (s: Server) => `U${s.top - s.height + 1}-${s.top}`;

export const gridRow = (s: Server) => `${RACK_UNITS + 1 - s.top}/span ${s.height}`;

export const nextOf = (id: string) => servers[(servers.findIndex((s) => s.id === id) + 1) % servers.length];

export const byId = (id: string) => {
  const server = servers.find((s) => s.id === id);
  if (!server) throw new Error(`no server ${id}`);
  return server;
};
