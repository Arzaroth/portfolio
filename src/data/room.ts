import {
  apps,
  archive,
  codegauge,
  friendHref,
  friendUnit,
  friends,
  gauges,
  infrastructure,
  lumen,
  ouroboros,
  recomp,
  sealed,
  selvedge,
  services,
  skills,
  smith,
  tools,
  upstream,
  upstreamHref,
  workbench,
  wyrmyon,
  type Link,
  type Project,
} from './projects';

export const RACK_UNITS = 42;

export type Face = 'black' | 'silver' | 'white' | 'beige';
export type Tape = 'red' | 'blue' | 'green' | 'black';
export type Front = 'ports' | 'brush' | 'bays' | 'vent' | 'discs' | 'glyph' | 'sealed' | 'beige' | 'ups';

export interface Server {
  id: string;
  height: number;
  face: Face;
  tape: Tape | null;
  label: string | null;
  front: Front;
  top: number;
  bottom: number;
}

const layout: [string, number, Face, Tape | null, string | null, Front][] = [
  ['switch', 1, 'black', 'blue', 'Switch', 'ports'],
  ['brush', 1, 'black', null, null, 'brush'],
  ['forge', 2, 'black', 'red', 'git.arzaroth.com', 'bays'],
  ['smith', 1, 'silver', 'black', 'smith', 'vent'],
  ['debparty', 1, 'black', 'green', 'DEB Party', 'vent'],
  ['nostragoalus', 2, 'white', 'green', 'Nostragoalus', 'bays'],
  ['coincherie', 2, 'black', 'red', 'La Coincherie', 'bays'],
  ['yaek', 1, 'silver', 'blue', 'Yaek', 'vent'],
  ['blossom', 1, 'white', 'red', 'BlosSom', 'vent'],
  ['wyrmyon', 2, 'black', 'blue', 'wyrmyon', 'bays'],
  ['lumen', 1, 'black', 'red', 'Lumen', 'vent'],
  ['tokengauge', 2, 'silver', 'black', 'TokenGauge', 'bays'],
  ['remuda', 1, 'black', 'red', 'remuda', 'vent'],
  ['tailgauge', 1, 'black', 'blue', 'TailGauge', 'vent'],
  ['codegauge', 1, 'black', 'green', 'CodeGauge', 'vent'],
  ['selvedge', 1, 'silver', 'blue', 'selvedge', 'vent'],
  ['c2c', 1, 'black', 'red', 'c2c-conv', 'vent'],
  ['resumove', 1, 'black', 'blue', 'resumove', 'vent'],
  ['t3cc', 1, 'black', 'green', 't3cc', 'vent'],
  ['skills', 1, 'silver', 'black', 'skills', 'vent'],
  ['bozos', 4, 'black', 'blue', 'The Bozos', 'discs'],
  ['ouroboros', 3, 'black', 'red', 'ouroboros', 'glyph'],
  ['workbench', 1, 'silver', 'black', 'Workbench', 'vent'],
  ['sealed', 1, 'black', 'red', 'Sealed', 'sealed'],
  ['upstream', 1, 'white', 'blue', 'Upstream', 'vent'],
  ['archive', 2, 'beige', 'black', 'Archive 2014-26', 'beige'],
  ['dotfiles', 1, 'black', 'green', 'dotfiles', 'vent'],
  ['ups', 4, 'black', 'red', 'UPS', 'ups'],
];

export const rack: Server[] = (() => {
  let top = RACK_UNITS;
  return layout.map(([id, height, face, tape, label, front]) => {
    const s = { id, height, face, tape, label, front, top, bottom: top - height + 1 };
    top -= height;
    return s;
  });
})();

export const fixtures = new Set(['switch', 'brush']);

export const slotOf = (s: Server) => (s.top === s.bottom ? `U${s.top}` : `U${s.bottom}-${s.top}`);

const named = (list: Project[], name: string) => {
  const p = list.find((x) => x.name === name);
  if (!p) throw new Error(`no project named ${name}`);
  return p;
};

const selvedgeProject: Project = {
  name: 'selvedge',
  icon: '/icons/selvedge.svg',
  description: `${selvedge.description} It saved the gauges ${selvedge.saved}.`,
  meta: 'Rust crate',
  links: [{ label: 'Source', href: selvedge.href }],
};

export const projects: Record<string, Project> = {
  forge: named(infrastructure, 'Code lives at home too'),
  smith,
  debparty: named(infrastructure, 'DEB Party'),
  nostragoalus: named(apps, 'Nostragoalus'),
  coincherie: named(apps, 'La Coincherie'),
  yaek: named(apps, 'Yaek'),
  blossom: named(apps, 'BlosSom'),
  wyrmyon,
  lumen,
  tokengauge: named(gauges, 'TokenGauge'),
  remuda: named(gauges, 'remuda'),
  tailgauge: named(gauges, 'TailGauge'),
  codegauge,
  selvedge: selvedgeProject,
  c2c: named(tools, 'c2c-conv'),
  resumove: named(tools, 'resumove'),
  t3cc: named(tools, 't3cc'),
  skills,
  dotfiles: named(infrastructure, 'dotfiles'),
  poucevert: named(workbench, 'Pouce Vert'),
};

export const duties: Record<string, string[]> = { selvedge: selvedge.duties };

export const colors: Record<string, string> = {
  forge: '#3b4250',
  smith: '#7a3b1d',
  debparty: '#c0234e',
  nostragoalus: '#17603d',
  coincherie: '#9b1c2a',
  yaek: '#e2b33c',
  blossom: '#f0b3c6',
  wyrmyon: '#4a2470',
  lumen: '#18213f',
  tokengauge: '#2b3442',
  remuda: '#8a5a32',
  tailgauge: '#3a4a5e',
  codegauge: '#556b2f',
  selvedge: '#c9c2d6',
  c2c: '#ff8a5c',
  resumove: '#2d6a8a',
  t3cc: '#26262e',
  skills: '#cfd8c0',
  dotfiles: '#1e2a24',
  poucevert: '#4f8a4a',
  bozos: '#2a1a12',
  ouroboros: '#10161a',
  workbench: '#3a3f46',
  sealed: '#2b2130',
  upstream: '#1f3a5a',
  archive: '#6b5f43',
  ups: '#1d2a22',
  cat: '#8a4f1e',
};

const short: Record<string, string> = {
  forge: 'The forge',
  bozos: 'PS2 ports',
  ups: 'UPS',
  poucevert: 'The plant',
  cat: 'The cat',
};

export const extras = ['poucevert', 'cat'] as const;

export const pickable = [...rack.filter((s) => !fixtures.has(s.id)).map((s) => s.id), ...extras];

export const labelOf = (id: string) => short[id] ?? projects[id]?.name ?? rack.find((s) => s.id === id)?.label ?? id;

export const whereOf = (id: string) => {
  const s = rack.find((x) => x.id === id);
  if (s) return slotOf(s);
  return id === 'poucevert' ? 'Beside the rack' : 'On top of the rack';
};

export interface Row {
  title: string;
  href?: string;
  aside?: string;
  chip?: 'ok' | 'up' | 'plain';
  note?: string;
  icon?: string | null;
}

export interface Card {
  id: string;
  name: string;
  icon?: string;
  sub?: string;
  badge?: string;
  paragraphs: string[];
  rows?: Row[];
  ordered?: boolean;
  extra?: { lead: string; rows: Row[] };
  footer?: (string | Link)[];
  links?: Link[];
}

const projectCard = (id: string, p: Project): Card => ({
  id,
  name: p.name,
  icon: p.icon,
  sub: p.meta,
  badge: p.wip ? 'On the workbench' : undefined,
  paragraphs: [p.description],
  rows: duties[id]?.map((d) => ({ title: d })),
  links: p.links,
});

const special: Record<string, Card> = {
  bozos: {
    id: 'bozos',
    name: 'The Bozos',
    icon: '/icons/bozos.png',
    sub: 'PlayStation 2 ports',
    paragraphs: [recomp.lede],
    rows: recomp.ports.map((p) => ({
      title: p.name,
      href: p.href,
      chip: p.status === 'Playable' ? 'ok' : 'up',
      aside: p.status,
      note: `${p.disc}. ${p.description}`,
    })),
    footer: ['Built on ', { label: recomp.engine.name, href: recomp.engine.href }, '. Progress on ', { label: recomp.watcher.name, href: recomp.watcher.href }, '.'],
    links: [{ label: recomp.group.name, href: recomp.group.href }],
  },
  ouroboros: {
    id: 'ouroboros',
    name: 'ouroboros',
    icon: '/icons/ouroboros.svg',
    sub: `${ouroboros.lastKnownLines.toLocaleString('en-US')} lines, from ${ouroboros.firstLines}`,
    paragraphs: [ouroboros.lede],
    rows: ouroboros.tiers.map(([title, note]) => ({ title, note })),
    ordered: true,
    links: [{ label: 'Source', href: ouroboros.href }],
  },
  workbench: {
    id: 'workbench',
    name: 'Workbench',
    sub: 'Not finished yet',
    paragraphs: [],
    rows: workbench.map((p) => ({ title: p.name, note: p.description, icon: p.icon ?? null })),
  },
  sealed: {
    id: 'sealed',
    name: 'Sealed',
    sub: 'Still taped shut',
    paragraphs: ["Two more. They open when they're ready."],
    rows: sealed.map((title) => ({ title, chip: 'plain', aside: 'Sealed' })),
  },
  upstream: {
    id: 'upstream',
    name: 'Upstream',
    sub: 'Pull requests to other projects',
    paragraphs: [],
    rows: upstream.map((u) => ({ title: u.name, href: upstreamHref(u), aside: u.when })),
    extra: {
      lead: "And friends' projects, where most of my time goes:",
      rows: friends.map((f) => ({ title: f.name, href: friendHref(f), aside: `${f.count.toLocaleString('en-US')} ${friendUnit(f)}` })),
    },
  },
  archive: {
    id: 'archive',
    name: 'Archive',
    sub: '2014 to 2026',
    paragraphs: ['The old box near the bottom. What I wrote before most of the rest.'],
    rows: archive.map((a) => ({ title: a.name, href: a.href, aside: a.years, note: a.description })),
  },
  ups: {
    id: 'ups',
    name: 'UPS',
    sub: 'Keeps the lights on',
    paragraphs: ['Everything above draws power from it, and so do the services that run on the rack.'],
    rows: services.filter(([, r]) => r !== 'app').map(([title, r]) => ({ title, aside: r === 'watch' ? 'watching' : 'plumbing' })),
  },
  cat: {
    id: 'cat',
    name: 'The cat',
    sub: 'Not a project',
    paragraphs: ['Sleeps on the warmest machine in the house, which is this one. Does not take pull requests.'],
  },
};

export const cardOf = (id: string): Card => {
  const p = projects[id];
  if (p) return projectCard(id, p);
  const c = special[id];
  if (!c) throw new Error(`no card for ${id}`);
  return c;
};

export const cards: Card[] = pickable.map(cardOf);

export const bootDrives: [string, string][] = [
  ['Primary master  ', `ouroboros, ${ouroboros.lastKnownLines.toLocaleString('en-US')} lines`],
  ['Primary slave   ', `${recomp.ports[0].disc}, ${recomp.ports[0].name}`],
  ['Secondary master', `selvedge, ${selvedge.saved} lighter`],
  ['Secondary slave ', 'None'],
];

export const bootServices = [
  ...services.filter(([, r]) => r === 'plumbing'),
  ...services.filter(([, r]) => r === 'watch'),
  ...services.filter(([, r]) => r === 'app'),
].map(([n]) => n);

export const discs = recomp.ports.map((p) => p.disc);
export const glyphLines = { first: ouroboros.firstLines, last: ouroboros.lastKnownLines };
