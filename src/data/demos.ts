const dim = (t: string) => `<span class="o-d">${t}</span>`;
const tint = (c: 'g' | 'y' | 'r' | 'c', t: string) => `<span class="o-${c}">${t}</span>`;
const bar = (pct: number, n = 14) => {
  const full = Math.round((pct / 100) * n);
  return '█'.repeat(full) + dim('░'.repeat(n - full));
};

export const fetchRows: [string, string][] = [
  ['role', 'CISO'],
  ['desk', 'Arch'],
  ['servers', 'Debian'],
  ['shell', 'zsh'],
  ['code', 'Forgejo at home, mirrored to GitHub'],
];

export const demos: Record<string, Record<string, string>> = {
  tokengauge: {
    tokengauge: `${dim('provider  window   used                  resets')}
claude    5h       ${tint('y', bar(58))}  58%   in 1h 52m
claude    weekly   ${tint('y', bar(36))}  36%   in 3d 4h
codex     5h       ${tint('g', bar(14))}  14%   in 4h 10m
kimi      daily    ${tint('r', bar(79))}  79%   in 6h 03m

${dim('at reset')}   claude 5h lands near ${tint('y', '81%')}
${dim('this month')} ${tint('c', '$41.20')} across 3 machines`,
  },
  remuda: {
    remuda: `${dim('cli     login      in use   kept fresh')}
claude  personal   ${tint('g', '●')}        2h ago
claude  work                2h ago
codex   personal   ${tint('g', '●')}        5h ago
codex   work                5h ago

${dim('history, settings and MCP logins are shared')}`,
  },
  tailgauge: {
    tailgauge: `${dim('provider')}   tailscale ${dim('(netbird installed, idle)')}
${dim('status')}     ${tint('g', 'connected')}
${dim('exit node')}  none

desk      100.64.0.4   ${tint('c', 'this machine')}
rack      100.64.0.2   ${tint('g', 'online')}
phone     100.64.0.9   ${dim('idle 12m')}`,
  },
  'c2c-conv': {
    'c2c-conv': `sharing this Claude Code session
${dim('guest')}    ${tint('g', 'joined')}, watching live
${dim('typing')}   off ${dim('until you hand them the keyboard')}
${tint('y', 'clown to clown conversation established')}`,
  },
  resumove: {
    resumove: `${dim('conversation')}  3f2c91 ${dim('(closed)')}
${dim('from')}          ~/Repos/old-name
${dim('to')}            ~/Repos/portfolio
${tint('g', 'rewrote 214 recorded paths')}
claude --resume now finds it from the new folder`,
  },
  t3cc: {
    t3cc: `Claude Code ${dim('to')} T3 Code
${tint('g', 'imported 12 threads')}
each thread resumes its Claude session, context included`,
  },
  dotfiles: {
    stow: `${dim('linked')} zsh, emacs, tmux, oh-my-posh
${tint('g', 'all packages in place')}`,
  },
};
