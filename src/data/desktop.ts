export type Color = 'peach' | 'rose' | 'gold' | 'sage' | 'teal' | 'sky' | 'lav' | 'clay' | 'ash';

export type Tree = number | ['v' | 'h', number, Tree, Tree];

export interface Workspace {
  id: string;
  label: string;
  color: Color;
  accent: Color;
  blurb: string;
  tree: Tree;
  aliases?: string[];
}

export const workspaces: Workspace[] = [
  { id: 'about', label: 'hello', color: 'peach', accent: 'rose', blurb: '', tree: ['v', 0.54, 0, ['h', 0.44, 1, 2]] },
  { id: 'apps', label: 'apps', color: 'sky', accent: 'lav', blurb: 'Nostragoalus, La Coincherie, Yaek, BlosSom', tree: ['v', 0.44, 0, ['h', 0.46, 1, ['v', 0.5, 2, 3]]] },
  { id: 'gauges', label: 'gauges', color: 'gold', accent: 'peach', blurb: 'Desktop panels, remuda, and the crate they share', tree: ['h', 0.6, 0, ['v', 0.5, 1, 2]] },
  { id: 'tools', label: 'claude code', color: 'lav', accent: 'rose', blurb: 'c2c-conv, resumove, t3cc', tree: ['v', 0.52, 0, ['h', 0.5, 1, 2]] },
  { id: 'workshop', label: 'workbench', color: 'sage', accent: 'teal', blurb: 'Tacite, Pouce Vert, Sheaf, and two sealed names', tree: ['v', 0.38, 0, ['h', 0.64, ['v', 0.5, 1, 2], 3]], aliases: ['sealed'] },
  { id: 'ouroboros', label: 'ouroboros', color: 'rose', accent: 'peach', blurb: 'Eight lines of Python that kept growing', tree: ['v', 0.46, 0, 1] },
  { id: 'selfhosted', label: 'self-hosting', color: 'teal', accent: 'sky', blurb: 'What runs on the rack', tree: ['v', 0.42, 0, ['h', 0.42, 1, ['v', 0.55, 2, 3]]] },
  { id: 'contributions', label: 'contributions', color: 'clay', accent: 'gold', blurb: "Friends' projects, and patches sent upstream", tree: ['h', 0.4, 0, 1] },
  { id: 'archive', label: 'early years', color: 'ash', accent: 'lav', blurb: '2014 onwards, ponies included', tree: ['h', 0.19, 1, 0] },
];

export const colorVar = (c: Color) => `var(--${c})`;

export const leaves = (t: Tree): number[] => (typeof t === 'number' ? [t] : [...leaves(t[2]), ...leaves(t[3])]);

export const byId = (id: string) => {
  const ws = workspaces.find((w) => w.id === id);
  if (!ws) throw new Error(`no workspace ${id}`);
  return ws;
};
