import type { FriendSpec, Upstream } from '../scripts/github';

export interface Link {
  label: string;
  href: string;
}

export interface Project {
  name: string;
  description: string;
  meta?: string;
  links?: Link[];
  wip?: boolean;
}

const gh = (repo: string) => `https://github.com/Arzaroth/${repo}`;
const source = (repo: string): Link => ({ label: 'Source', href: gh(repo) });

export const elsewhere = [
  { label: 'GitHub', detail: '@Arzaroth', href: 'https://github.com/Arzaroth' },
  { label: 'Forgejo', detail: 'git.arzaroth.com', href: 'https://git.arzaroth.com/Arzaroth' },
  { label: 'APT repository', detail: 'deb.arzaroth.com', href: 'https://deb.arzaroth.com' },
];

export const apps: Project[] = [
  {
    name: 'Nostragoalus',
    description:
      'A score-prediction game. Friends predict match scores, earn points for how close they get, and fight over per-competition and global leaderboards. Live crowd totals, bookmaker odds frozen at kickoff, one x2 joker per round, league chat. Football by default, and rugby union works too.',
    meta: 'TypeScript, Nuxt, Node or Bun',
    links: [{ label: 'Play', href: 'https://goal.arzaroth.com' }, source('Nostragoalus')],
  },
  {
    name: 'La Coincherie',
    description: 'Play coinche with your friends when you live 800 km apart. Cameras on, your house rules.',
    meta: 'TypeScript, Svelte',
    links: [{ label: 'Sit at the table', href: 'https://coinche.arzaroth.com' }],
  },
  {
    name: 'Yaek',
    description:
      'Pulls Thai text apart so you can read what someone wrote to you. Offline dictionary, tones derived from the spelling, and no network request you did not ask for.',
    meta: 'TypeScript, Expo, React Native',
    links: [{ label: 'Open Yaek', href: 'https://yaek.arzaroth.com' }],
  },
  {
    name: 'BlosSom',
    description:
      'Scan a document with your phone, then share, save or print it as one PDF or as photos. No account, and nothing leaves the phone unless you send it.',
    meta: 'TypeScript, Expo, React Native',
    links: [{ label: 'Get BlosSom', href: 'https://blossom.arzaroth.com' }],
  },
];

export const lumen: Project = {
  name: 'Lumen',
  description:
    "An Apple TV style home screen for Android TV and Google TV, with the scripts that debloat the TV and make Lumen its Home. Everything is reversible: packages are disabled, never uninstalled, and the TV's state is backed up first. The focused app's logo is rebuilt in lit 3D voxels under a night sky that turns at the Earth's real rate.",
  meta: 'Java, Android TV',
  links: [source('Lumen')],
};

export const wyrmyon: Project = {
  name: 'wyrmyon',
  description:
    'The magic-wormhole, with a wyrm in it. It speaks the magic-wormhole protocol, so it sends to and receives from the Python wormhole and every other client. When both ends run wyrmyon, the data moves over iroh instead: QUIC with hole-punching, one stream per file, verified and resumable. You never pick a protocol or a server.',
  meta: 'Rust, iroh',
  links: [source('wyrmyon')],
};

export const tools: Project[] = [
  {
    name: 'c2c-conv',
    description:
      'Share one Claude Code session with a second person. They watch it live, and when you let them, they type into it as if they were you. The Cs in c2c could be Claude, Codex... or even clown. Ever heard of clown to clown conversation?',
    meta: 'TypeScript',
    links: [source('c2c-conv')],
  },
  {
    name: 'resumove',
    description:
      'Moves a Claude Code conversation to another folder, so claude --resume finds it from there. It rewrites the recorded paths, and refuses to touch a conversation that is still open.',
    meta: 'Python',
    links: [source('resumove')],
  },
  {
    name: 't3cc',
    description:
      "Moves conversation history between Claude Code and T3 Code, both ways, without the limits of T3's own importer. An imported thread resumes the same Claude session, so the model keeps its context.",
    meta: 'Python',
    links: [source('t3cc')],
  },
];

export const skills: Project = {
  name: 'skills',
  description:
    'The agent skills I use every day with Claude Code, published for anyone to install: staying with a pull request until it merges, working each round of review, merging a stack of dependent PRs, cutting releases, keeping docs in step with the code, a very strict code review, and timesheets rebuilt from session logs.',
  meta: 'Claude Code, npx skills',
  links: [source('skills')],
};

export const gauges: Project[] = [
  {
    name: 'TokenGauge',
    description:
      'Shows usage limits, costs and token counts for Claude, Codex, Kimi, Grok, GLM and a few more. It predicts where each limit will be at reset and totals spend across all your machines. With remuda, every stored login gets its own meter.',
    meta: 'Waybar, Plasma, GNOME, Quickshell, TUI',
    links: [source('TokenGauge')],
  },
  {
    name: 'remuda',
    description:
      'A remuda is the herd of spare horses a rider picks a fresh mount from. This one holds Claude Code and Codex logins, and switches the one each CLI uses without logging out. History, settings and MCP logins stay shared, and a timer keeps the resting logins fresh. Its page shows the usage TokenGauge reads for the login in use.',
    meta: 'CLI, systemd timer',
    links: [source('remuda')],
  },
  {
    name: 'TailGauge',
    description:
      "Puts Tailscale and NetBird in your panel, and switches between them when both are installed. Turn the VPN on and off, and copy any machine's address. Tailscale also gets exit nodes, Mullvad regions and Taildrop. On NetBird you can join and leave networks. There's no daemon, it calls each provider's CLI.",
    meta: 'Plasma, GNOME, Quickshell, TUI',
    links: [source('TailGauge')],
  },
];

export const selvedge = {
  description:
    'A selvedge is the woven edge that stops cloth from unravelling. This crate stops a binary and the QML and JavaScript it feeds from drifting apart. Both ship in one archive and update together.',
  duties: [
    'Fetches the latest release from GitHub',
    'Replaces the running binary in place',
    'Reinstalls every desktop frontend from the same archive',
    'Keeps old command names alive as symlinks',
  ],
  saved: '1,400 lines',
  href: gh('selvedge'),
};

export const codegauge: Project = {
  name: 'CodeGauge',
  description:
    "Same family name, different job. It walks a repository's git history, counts every line once per day, and charts production code against test code over time. The dashboard is built into one static binary, and git doesn't need to be installed.",
  meta: 'Rust, gitoxide',
  links: [{ label: 'Source on Forgejo', href: 'https://git.arzaroth.com/Arzaroth/CodeGauge' }],
};

export const workbench: Project[] = [
  {
    name: 'Tacite',
    description:
      'Tracks contracts, subscriptions and warranties. It works out the legal deadlines, warns you while you can still act, and drafts the cancellation or warranty letter.',
    meta: 'TypeScript, Fastify, Postgres',
    wip: true,
  },
  {
    name: 'Pouce Vert',
    description:
      'A plant care app for the phone. Care sheets for common houseplants, pet toxicity with sources, watering reminders, and a diagnosis from a photo of the sad leaf.',
    meta: 'Expo, React Native',
    wip: true,
  },
  {
    name: 'Sheaf',
    description:
      "An open-source Android client for paperless-ngx, built against the v3 API so a server update does not break it. Document scanner with auto-crop, upload from any app's share sheet, offline-first with a draft queue, bulk inbox triage, and a real UI for server-side mail rules. Works behind reverse proxies, with self-signed certificates, mTLS, OIDC and several servers.",
    meta: 'Android first, iOS in development',
    wip: true,
  },
];

export const sealed = ['Magister', 'Rackmancy'];

export const ouroboros = {
  lede: 'What happens when a script that draws one small figure never gets told to stop. The first commit draws a lattice glyph in eight lines of Python. The latest one draws the same glyph.',
  firstLines: 8,
  lastKnownLines: 27759,
  tiers: [
    ['Reference', 'One digest per order. Every other tier is tested against it.'],
    ['A language for the glyph', 'A program computes the figure, through nineteen layers that include monads, a pass manager and an event-sourced rasteriser.'],
    ['LLVM', 'Lowers the bytecode to LLVM IR, JIT-compiles it and links a native ELF.'],
    ['A second language', 'General enough to write a compiler in. Its compiler is written in itself, and a three-generation fixpoint proves the build.'],
    ['The closed loop', 'The first front end, rewritten in the second language. Both emit the same bytes for any program.'],
    ['Machine code', 'Hand-encoded x86-64, aarch64 and riscv64 in a static ELF of about a kilobyte. No assembler, linker or libc.'],
    ['WebAssembly', 'The same module as a wasm reactor that imports nothing.'],
    ['No kernel', 'One boot sector walks the machine from 16-bit real mode to 64-bit and runs the glyph with nothing underneath.'],
  ],
  href: gh('ouroboros'),
};

type Role = 'plumbing' | 'watch' | 'app';

export const services: [string, Role][] = [
  ['Git forge', 'plumbing'],
  ['CI runners', 'plumbing'],
  ['Single sign-on', 'plumbing'],
  ['Mesh VPN', 'plumbing'],
  ['Password vault', 'plumbing'],
  ['Photo library', 'plumbing'],
  ['Document archive', 'plumbing'],
  ['Notes sync', 'plumbing'],
  ['Video calls', 'plumbing'],
  ['Team chat', 'plumbing'],
  ['Media server', 'plumbing'],
  ['Local LLM chat', 'plumbing'],
  ['SIEM', 'watch'],
  ['Uptime checks', 'watch'],
  ['Metrics', 'watch'],
  ['Backups', 'watch'],
  ['Update watcher', 'watch'],
  ['Nostragoalus', 'app'],
  ['La Coincherie', 'app'],
  ['Yaek', 'app'],
  ['APT mirror', 'plumbing'],
];

export const infrastructure: Project[] = [
  {
    name: 'DEB Party',
    description:
      'Turns a short list of GitHub projects into a tidy .deb mini-mirror. Picks the right release asset, repackages bare binaries, prunes old versions and publishes through Aptly. The gauges ship through it.',
    meta: 'Python, Aptly',
    links: [{ label: 'deb.arzaroth.com', href: 'https://deb.arzaroth.com' }, source('deb.arzaroth.com')],
  },
  {
    name: 'Code lives at home too',
    description:
      'Every repository here lives on a Forgejo instance on the rack. Server-side mirrors push it to GitHub, which is only the shop window.',
    meta: 'Forgejo, Forgejo Actions',
    links: [{ label: 'git.arzaroth.com', href: 'https://git.arzaroth.com/Arzaroth' }],
  },
  {
    name: 'smith',
    description:
      "A Forgejo CLI with gh's command surface, so muscle memory carries over: smith pr checkout 42, smith run watch, smith issue list --label bug. Feature complete wherever Forgejo's API can back it. Written in Zig, mostly because why not.",
    meta: 'Zig',
    links: [source('smith')],
  },
  {
    name: 'dotfiles',
    description: 'Zsh, Emacs, tmux and prompt configuration as GNU Stow packages. Arch on the desk, Debian on the servers.',
    meta: 'Emacs Lisp, shell',
    links: [source('dotfiles')],
  },
];

export const recomp = {
  lede: "Not emulators. Each port statically recompiles a game's own PlayStation 2 code to C++ and runs it as a native Linux program, on a reimplementation of the PS2 hardware. No game files are included: you need your own disc.",
  engine: { name: 'PS2Recomp', href: 'https://github.com/boubou666/PS2Recomp' },
  ports: [
    {
      name: 'Soulcalibur III',
      tab: 'Soulcalibur III',
      disc: 'SLUS-21216',
      status: 'Playable',
      description:
        'Playable from start to finish in automated tests, now in human testing. Fights run at 60 frames per second with music and voices, every mode has been played through, and saves load back after a restart.',
      href: gh('SoulCaliburIII_Recomp'),
    },
    {
      name: 'Smash Court Tennis Pro Tournament 2',
      tab: 'Smash Court Tennis 2',
      disc: 'SLUS-20933',
      status: 'Bring-up',
      description: 'Boots, loads its IOP modules and code overlays, and reaches the main menu, its movie playing behind it.',
      href: gh('SmashCourtTennisProTournament2_Recomp'),
    },
    {
      name: 'Fighting for One Piece',
      tab: 'One Piece',
      disc: 'SLPS-25545',
      status: 'Bring-up',
      description: 'From the title screen through character select into a 3D fight, Luffy against Ace, at about 54 frames per second on the CPU rasterizer.',
      href: gh('FightingForOnePiece_Recomp'),
    },
  ],
};

const myPulls = (repo: string) => `https://github.com/${repo}/pulls?q=is%3Apr+author%3AArzaroth`;

export const friends: FriendSpec[] = [
  { name: 'doot', repo: 'boubou666/doot', by: 'pulls', count: 23, when: '2026' },
  { name: 'butbutbut', repo: 'boubou666/butbutbut', by: 'pulls', count: 4, when: '2026' },
  { name: 'rocket-vibe', repo: 'Guillaume69/rocket-vibe', by: 'commits', count: 1273, when: '2026' },
  { name: 'PS2Recomp', repo: 'boubou666/PS2Recomp', by: 'commits', count: 181, when: '2026' },
];

export const friendHref = (f: FriendSpec) =>
  f.by === 'pulls' ? myPulls(f.repo) : `https://github.com/${f.repo}/commits?author=Arzaroth`;

export const friendUnit = (f: FriendSpec) => {
  const unit = f.by === 'pulls' ? 'pull request' : 'commit';
  return f.count === 1 ? unit : `${unit}s`;
};

export const notUpstream = ['hyprwm/hyprsunset', 'boubou666/desktop-overlay'];

export const upstreamNames: Record<string, string> = {
  'laravel/framework': 'laravel/framework',
  'hfig/MAPI': 'hfig/MAPI',
  'php-gettext/Gettext': 'php-gettext',
};

export const upstream: Upstream[] = [
  { name: 'ente', repo: 'ente/ente', when: '1 PR, 2026' },
  { name: 'authentik', repo: 'goauthentik/authentik', when: '1 PR, 2026' },
  { name: 'acme2certifier', repo: 'grindsa/acme2certifier', when: '2 PRs, 2026' },
  { name: 'hfig/MAPI', repo: 'hfig/MAPI', when: '3 PRs, 2020-24' },
  { name: 'laravel/framework', repo: 'laravel/framework', when: '2 PRs, 2022-23' },
  { name: 'phpbench', repo: 'phpbench/phpbench', when: '1 PR, 2022' },
  { name: 'sendria', repo: 'msztolcman/sendria', when: '1 PR, 2021' },
  { name: 'php-gettext', repo: 'php-gettext/Gettext', when: '1 PR, 2020' },
  { name: 'spot2', repo: 'spotorm/spot2', when: '3 PRs, 2017-20' },
  { name: 'php-shellcommand', repo: 'mikehaertl/php-shellcommand', when: '2 PRs, 2018' },
  { name: 'weeNetsoul', repo: 'godric7/weeNetsoul', when: '2 PRs, 2014' },
];

export const upstreamHref = (u: Upstream) => myPulls(u.repo);

export const archive = [
  { from: 2014, to: 2014, name: 'virtualnetwork', description: 'A small tool for understanding how networks work.', lang: 'Python' },
  { from: 2014, to: 2014, name: 'simple_flooder', description: 'A tiny TCP flooder in C.', lang: 'C' },
  { from: 2014, to: 2015, name: 'RODeco', description: 'Override any function inside a Python module at run time, when you do not like how it works.', lang: 'Python' },
  { from: 2015, to: 2015, name: 'Pon3Ark', description: 'Extracts the ark data files of the mobile game My Little Pony.', lang: 'Python' },
  {
    from: 2014,
    to: 2016,
    name: 'CelestiaSunrise',
    description: 'Savegame editor for the same pony game. The most starred thing I ever wrote. In every sense of the term.',
    lang: 'Python',
  },
  { from: 2016, to: 2017, name: 'HearthPacks', description: 'Automated pack opening on HearthPwn.', lang: 'Python' },
  { from: 2018, to: 2026, name: 'Skynet', description: 'A Slack bot with a lot of opinions and very little restraint.', lang: 'JavaScript, private', private: true },
  { from: 2015, to: 2026, name: 'python_rapidxml', description: 'Python bindings for RapidXml, a fast C++ XML parser. Old, and still maintained.', lang: 'C++' },
].map((a) => ({
  ...a,
  years: a.from === a.to ? `${a.from}` : `${a.from}-${String(a.to).slice(2)}`,
  href: a.private ? undefined : gh(a.name),
}));
