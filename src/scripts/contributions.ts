import type { FriendSpec, Upstream } from './github';
import { latestContributions } from './github';
import { esc } from './terminal';
import { friendUnit, friends, notUpstream, upstreamHref, upstreamNames } from '../data/projects';

export const upstreamRows = (list: Upstream[]) =>
  list
    .map(
      (u) =>
        `<li class="row" style="--c:var(--clay)"><span class="fi"></span><span class="nm"><a href="${esc(upstreamHref(u))}" target="_blank" rel="noopener">${esc(u.name)}</a></span><span class="dt">${esc(u.when)}</span></li>`,
    )
    .join('');

export const friendLabel = (f: FriendSpec) => `${friendUnit(f)}, ${f.when}`;

export const loadContributions = () => latestContributions(friends, notUpstream, upstreamNames);

export function showContributions(ws: HTMLElement, latest: { friends: FriendSpec[]; upstream: Upstream[] }) {
  const fmt = (n: number) => n.toLocaleString('en-US');
  for (const f of latest.friends) {
    const card = ws.querySelector<HTMLElement>(`[data-repo="${f.repo}"]`);
    if (!card) continue;
    const counter = card.querySelector<HTMLElement>('[data-count]')!;
    const settled = counter.textContent === fmt(Number(counter.dataset.count));
    counter.dataset.count = String(f.count);
    if (settled && ws.classList.contains('on')) counter.textContent = fmt(f.count);
    card.querySelector('small')!.textContent = friendLabel(f);
  }
  if (latest.upstream.length) ws.querySelector('.upstream')!.innerHTML = upstreamRows(latest.upstream);
}
