export const LATEST_RELEASE = 'https://api.github.com/repos/Arzaroth/ouroboros/releases/latest';

export function parseLoc(notes: string): number | undefined {
  const m = notes.match(/^LOC: (\d+)\s*$/m);
  return m ? Number(m[1]) : undefined;
}

export async function latestLines(): Promise<number | undefined> {
  const res = await fetch(LATEST_RELEASE);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { body } = (await res.json()) as { body?: string };
  return parseLoc(body ?? '');
}

export function showLines(pane: HTMLElement, lines: number) {
  const fmt = (n: number) => n.toLocaleString('en-US');
  const counter = pane.querySelector<HTMLElement>('[data-count]')!;
  const settled = counter.textContent === fmt(Number(counter.dataset.count));
  counter.dataset.count = String(lines);
  if (settled && pane.classList.contains('on')) counter.textContent = fmt(lines);
  pane.querySelectorAll('[data-lines]').forEach((el) => (el.textContent = fmt(lines)));
}
