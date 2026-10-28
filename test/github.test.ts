import { describe, expect, it } from 'vitest';
import { commitsFrom, friendCounts, pullsFrom, span, upstreamFrom, type FriendSpec, type Pull } from '../src/scripts/github';
import { friends, notUpstream, upstream, upstreamNames } from '../src/data/projects';

const pr = (repo: string, year: number, merged = true): Pull => ({ repo, year, merged });

describe('contributions from GitHub', () => {
  it('reads the repository, the year and whether a pull request was merged', () => {
    const json = {
      items: [
        { repository_url: 'https://api.github.com/repos/ente/ente', created_at: '2026-09-20T10:00:00Z', pull_request: { merged_at: null } },
        { repository_url: 'https://api.github.com/repos/hfig/MAPI', created_at: '2024-05-05T10:00:00Z', pull_request: { merged_at: '2024-05-10T12:49:53Z' } },
      ],
    };
    expect(pullsFrom(json)).toEqual([pr('ente/ente', 2026, false), pr('hfig/MAPI', 2024)]);
  });

  it('finds my commit count among the contributors', () => {
    expect(commitsFrom([{ login: 'someone', contributions: 9 }, { login: 'Arzaroth', contributions: 181 }])).toBe(181);
    expect(commitsFrom([{ login: 'someone', contributions: 9 }])).toBeUndefined();
  });

  it('writes a span of years the short way', () => {
    expect(span([2017, 2020, 2017])).toBe('2017-20');
    expect(span([2026])).toBe('2026');
  });

  it('counts merged pull requests, or all of them when none was merged', () => {
    const list = upstreamFrom([pr('a/x', 2022), pr('a/x', 2023), pr('a/x', 2022, false), pr('b/y', 2026, false), pr('b/y', 2026, false)], [], {});
    expect(list).toEqual([
      { repo: 'b/y', name: 'y', when: '2 PRs, 2026' },
      { repo: 'a/x', name: 'x', when: '2 PRs, 2022-23' },
    ]);
  });

  it('leaves out the repositories it is told to, and names the ones it is told to', () => {
    const list = upstreamFrom([pr('hyprwm/hyprsunset', 2025, false), pr('laravel/framework', 2023)], notUpstream, upstreamNames);
    expect(list).toEqual([{ repo: 'laravel/framework', name: 'laravel/framework', when: '1 PR, 2023' }]);
  });

  it('counts friends by pull request or by commit, and keeps the known count when GitHub has none', () => {
    const specs: FriendSpec[] = [
      { name: 'doot', repo: 'boubou666/doot', by: 'pulls', count: 1, when: '2025' },
      { name: 'rocket-vibe', repo: 'Guillaume69/rocket-vibe', by: 'commits', count: 233, when: '2026' },
      { name: 'quiet', repo: 'friend/quiet', by: 'pulls', count: 7, when: '2024' },
    ];
    const got = friendCounts(specs, [pr('boubou666/doot', 2026), pr('boubou666/doot', 2026), pr('boubou666/doot', 2026, false)], {
      'Guillaume69/rocket-vibe': 1273,
    });
    expect(got.map((f) => [f.name, f.count, f.when])).toEqual([
      ['doot', 2, '2026'],
      ['rocket-vibe', 1273, '2026'],
      ['quiet', 7, '2024'],
    ]);
  });

  it('ships a fallback in the order the live list sorts into', () => {
    const pulls = upstream.flatMap((u) => {
      const [, n, lo, hi] = u.when.match(/^(\d+) PRs?, (\d{4})(?:-(\d{2}))?$/)!;
      const last = hi ? Number(lo.slice(0, 2) + hi) : Number(lo);
      return Array.from({ length: Number(n) }, (_, i) => pr(u.repo, i === 0 ? Number(lo) : last));
    });
    expect(upstreamFrom(pulls, notUpstream, upstreamNames)).toEqual(upstream);
  });

  it('never lists a friend among the upstream projects', () => {
    const repos = upstream.map((u) => u.repo);
    for (const f of friends) expect(repos).not.toContain(f.repo);
  });
});
