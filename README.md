# portfolio

Arzaroth's page at [arzaroth.com](https://arzaroth.com): a 42U rack in a living room, drawn
with three.js, where every server is a project. Pull one out to read what it is. The
Konami code boots one of the machines into the previous design, a tiling desktop where
each part of the work is a workspace, now at `/desktop/`.

## Develop

Node 22. With [mise](https://mise.jdx.dev):

```sh
mise run dev       # http://localhost:4321
mise run check     # types, unit tests, build, em dash and release checks
mise run e2e       # the built site in a desktop and a phone browser
```

Or with npm directly: `npm run dev`, `npm run check`, `npm test`, `npm run build`,
`npm run e2e`.

## Where things live

- `src/data/projects.ts`: every piece of copy on the site.
- `src/data/room.ts`: the rack in the room, top to bottom, each server's face, label tape and
  colour, and the card it opens, built from `projects.ts`.
- `src/pages/index.astro` and `src/components/RoomCard.astro`: the room. Every card is in
  the page, so it reads without JavaScript or WebGL, as a list of cards.
- `src/scripts/room/`: the room in three.js. `scene.ts` builds it and handles picking, the
  camera, day and night, and the Konami code, `textures.ts` paints the server faces and the
  desk's monitor, `cat.ts` the cat asleep on the rack, and `boot.ts` the BIOS and boot
  screens shown on the way into the desktop.
- `src/styles/room.css`: the room's stylesheet.
- `src/pages/desktop.astro`: the tiling desktop.
- `src/data/desktop.ts`: the workspaces, their colours, and the layout tree that splits each
  one into tiles. A leaf is a window, numbered in the order the workspace's component
  lists them.
- `src/data/demos.ts`: what each terminal prints when its program's name is typed, and the
  fastfetch lines.
- `src/components/`: one component per workspace, plus `Window`, `Shell` (the prompt and
  command line inside a terminal window) and `Panel` (one tab of a tabbed window).
- `src/scripts/desktop.ts`: switching workspaces, tiling, focus, tabs and keyboard shortcuts,
  registered through [TanStack Hotkeys](https://tanstack.com/hotkeys/latest).
- `src/scripts/tile.ts`: turns a layout tree into tiles, edges snapped to device pixels. It
  can leave windows out, their share of each split going to their neighbour, which is how
  the windows of a workspace open one by one.
- `src/data/rack.ts` and `src/scripts/rack3d.ts`: the 3D rack in self-hosting, a server per
  service, drawn with three.js once that workspace opens.
- `src/scripts/floating.ts`: the windows' physics when the Konami code sets them floating.
- `src/scripts/terminal.ts`: the command line in each terminal window.
- `src/scripts/ouroboros.ts`: ouroboros's line count, read from its latest release notes.
- `src/scripts/github.ts`: the friends' counts and the patches sent upstream, from one search
  for my pull requests and the contributors list of each friend's project counted in
  commits. `projects.ts` lists the friends, the repositories to leave out, and the counts
  to show when GitHub cannot be reached.
- `src/styles/`: one stylesheet per area. The stacked layout is the default; the tiled
  one needs JavaScript and a screen wider than 760 px. `responsive.css` loads last.
- `test/`: unit tests for the rack, the layout trees and the terminal. `e2e/`: Playwright,
  desktop and phone, one spec for the room and one for the desktop.

Adding a workspace means adding it to `desktop.ts` and a component with a matching
`<Workspace id>` to `src/pages/desktop.astro`. The unit tests fail if a layout tree does not
place each of the component's windows exactly once.

## Release and deploy

CI on Forgejo runs everything in `mise run check` plus the end-to-end suite. Deploying is
done by hand:

1. Move the `Unreleased` entries in `CHANGELOG.md` under a new dated version, and set the
   same version in `package.json`.
2. Commit, then tag `vX.Y.Z` and push the tag.
3. `mise run deploy` runs the checks and the end-to-end suite, builds, and rsyncs `dist/`
   to `/srv/www/arzaroth.com/htdocs` on the host. Shared downloads live outside the web
   root, in `/srv/www/arzaroth.com/files`, served under `/files/`.
