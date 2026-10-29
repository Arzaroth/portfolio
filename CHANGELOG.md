# Changelog

All notable changes to this site are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), the versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html), and each version is a git
tag `vX.Y.Z` on the commit it describes.

The version lives in `package.json` and nowhere else. `tools/check_release.mjs` runs in
CI and refuses a version with no dated section here.

## [Unreleased]

### Changed

- All three PS2 ports are playable: Smash Court Tennis Pro Tournament 2 and Fighting for
  One Piece left bring-up, and every port now draws with OpenGL.

## [0.4.0] - 2026-10-28

### Added

- New projects: Lumen, a home screen for Android TV, in self-hosting; smith and wyrmyon
  as tabs of the toolbox terminal; skills among the Claude Code tools; and a ps2
  workspace, on ctrl and 0, for three PlayStation 2 games recompiled to native Linux
  programs, a tab each.
- boubou's PS2Recomp fork among the friends' projects.
- The rack in self-hosting, in 3D: a server per service, coloured by role, to turn by
  dragging. A server under the pointer, or under its name in the list, slides out.
- Something happens on the Konami code.
- Terminal windows you can type in. Each program's name prints a sample of what it does,
  and the prompt is drawn after the owner's own.

### Changed

- The site is a tiling desktop instead of a rack. A bar holds one workspace per part of the
  work, switched with ctrl and 1 to 9 or 0, and each project is a window: a browser, a
  terminal, a file manager or a note. The focus follows the pointer, h, j, k and l move it
  from the keyboard, and m swaps a window into the main tile. The gauges, smith and wyrmyon
  share one terminal in the toolbox, a tab each, walked with tab and shift tab while the
  pointer is on it. On a phone, and without JavaScript, the windows stack in one column.
- The page is dark only.
- The friends' counts and the patches sent upstream come from GitHub, when the site is
  built and again in the visitor's browser, so a new pull request shows without a
  redeploy. The counts in `projects.ts` stand in when GitHub cannot be reached.
  rocket-vibe now shows 1,273 commits.

- ouroboros's line count comes from the `LOC:` line of its latest release notes, read at
  build time and again in the visitor's browser, so a new release shows without a
  redeploy. The build keeps a last known count for when GitHub cannot be reached.

## [0.3.0] - 2026-09-29

### Added

- A Claude Code server: c2c-conv, moved over from Apps, with resumove and t3cc.
- remuda in the Gauges section, threaded to TokenGauge, which meters its logins. It ships
  through selvedge too.
- BlosSom among the apps, with a link to its site.
- An Under wraps server, its LED dark, naming Magister and Rackmancy and nothing more.
- rocket-vibe among the friends' projects, counted in commits, and weeNetsoul upstream.

### Changed

- The early years show each project as a range, from first to last commit, sorted by the
  last one, without the star counts.
- Contributions list the projects, with the number of pull requests (or commits) and the
  years, and no longer describe the changes.

### Fixed

- The browser's back and forward buttons move between the servers visited. Switching
  server used to replace the history entry instead of adding one.

## [0.2.0] - 2026-09-24

### Added

- A favicon: the rack in miniature, three servers with their cable colours and lit LEDs,
  drawn on the 16 px grid. Also as an ICO, an Apple touch icon, 192 and 512 PNGs and a
  web manifest.

### Changed

- On load, the servers slide into the rack from the left instead of the right.

## [0.1.0] - 2026-09-24

### Added

- The page, laid out as a 42U rack. Each section is a server: Hello, Apps, Gauges,
  Workbench, ouroboros, Self-hosting, Contributions and Early years. Choosing one powers
  it up and shows its section. Every server is patched to a bar beside the rack, and the
  active cable carries traffic.
- J and K switch server from anywhere, the arrow keys move along the rack once a server
  has focus, and `#id` links open a section directly.
- On a phone the rack becomes a strip of servers across the top.
- Built with Astro. Copy lives in `src/data`, one component per section.
- Unit tests for the rack layout and an end-to-end suite that drives the built site in a
  desktop and a phone browser.
- `tools/deploy.sh` publishes `dist/` to arzaroth.com.

[Unreleased]: https://git.arzaroth.com/Arzaroth/portfolio/compare/v0.4.0...HEAD
[0.4.0]: https://git.arzaroth.com/Arzaroth/portfolio/compare/v0.3.0...v0.4.0
[0.3.0]: https://git.arzaroth.com/Arzaroth/portfolio/compare/v0.2.0...v0.3.0
[0.2.0]: https://git.arzaroth.com/Arzaroth/portfolio/compare/v0.1.0...v0.2.0
[0.1.0]: https://git.arzaroth.com/Arzaroth/portfolio/releases/tag/v0.1.0
