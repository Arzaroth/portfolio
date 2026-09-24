# Changelog

All notable changes to this site are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), the versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html), and each version is a git
tag `vX.Y.Z` on the commit it describes.

The version lives in `package.json` and nowhere else. `tools/check_release.mjs` runs in
CI and refuses a version with no dated section here.

## [Unreleased]

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

[Unreleased]: https://git.arzaroth.com/Arzaroth/portfolio/compare/v0.1.0...HEAD
[0.1.0]: https://git.arzaroth.com/Arzaroth/portfolio/releases/tag/v0.1.0
