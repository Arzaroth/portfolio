export const ME = 'Arzaroth';

export const PULLS_URL = `https://api.github.com/search/issues?q=${encodeURIComponent(`author:${ME} type:pr -user:${ME}`)}&per_page=100`;
export const contributorsUrl = (repo: string) => `https://api.github.com/repos/${repo}/contributors?per_page=100`;

export interface Pull {
  repo: string;
  year: number;
  merged: boolean;
}

export interface FriendSpec {
  name: string;
  repo: string;
  by: 'pulls' | 'commits';
  count: number;
  when: string;
}

export interface Upstream {
  name: string;
  repo: string;
  when: string;
}

interface SearchItem {
  repository_url: string;
  created_at: string;
  pull_request?: { merged_at: string | null };
}

export function pullsFrom(json: { items?: SearchItem[] }): Pull[] {
  return (json.items ?? []).map((i) => ({
    repo: i.repository_url.replace('https://api.github.com/repos/', ''),
    year: Number(i.created_at.slice(0, 4)),
    merged: Boolean(i.pull_request?.merged_at),
  }));
}

export function commitsFrom(json: { login: string; contributions: number }[]) {
  return json.find((c) => c.login.toLowerCase() === ME.toLowerCase())?.contributions;
}

const counted = (pulls: Pull[]) => {
  const merged = pulls.filter((p) => p.merged);
  return merged.length ? merged : pulls;
};

export const span = (years: number[]) => {
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  return lo === hi ? `${lo}` : `${lo}-${String(hi).slice(2)}`;
};

export function friendCounts(friends: FriendSpec[], pulls: Pull[], commits: Record<string, number | undefined>): FriendSpec[] {
  return friends.map((f) => {
    if (f.by === 'commits') return { ...f, count: commits[f.repo] ?? f.count };
    const mine = counted(pulls.filter((p) => p.repo === f.repo));
    return mine.length ? { ...f, count: mine.length, when: span(mine.map((p) => p.year)) } : f;
  });
}

export function upstreamFrom(pulls: Pull[], skip: string[], names: Record<string, string>): Upstream[] {
  const byRepo = new Map<string, Pull[]>();
  for (const p of pulls) {
    if (skip.includes(p.repo)) continue;
    byRepo.set(p.repo, [...(byRepo.get(p.repo) ?? []), p]);
  }
  return [...byRepo]
    .map(([repo, all]) => {
      const mine = counted(all);
      const years = mine.map((p) => p.year);
      return { repo, last: Math.max(...years), first: Math.min(...years), when: `${mine.length} PR${mine.length > 1 ? 's' : ''}, ${span(years)}` };
    })
    .sort((a, b) => b.last - a.last || b.first - a.first || a.repo.localeCompare(b.repo))
    .map(({ repo, when }) => ({ repo, when, name: names[repo] ?? repo.split('/')[1] }));
}

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function latestContributions(friends: FriendSpec[], skip: string[], names: Record<string, string>) {
  const own = friends.map((f) => f.repo);
  const [pulls, ...counts] = await Promise.all([
    json<{ items?: SearchItem[] }>(PULLS_URL).then(pullsFrom),
    ...friends.map((f) =>
      f.by === 'commits' ? json<{ login: string; contributions: number }[]>(contributorsUrl(f.repo)).then(commitsFrom) : Promise.resolve(undefined),
    ),
  ]);
  const commits = Object.fromEntries(friends.map((f, i) => [f.repo, counts[i]]));
  return {
    friends: friendCounts(friends, pulls, commits),
    upstream: upstreamFrom(pulls, [...skip, ...own], names),
  };
}
