# portfolio

Arzaroth's page at [arzaroth.com](https://arzaroth.com), laid out as a 42U rack. Each
section is a server in the rack.

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

- `src/data/servers.ts`: the rack. Each server's slot, height, cable colour and port count.
- `src/data/projects.ts`: every piece of copy on the page.
- `src/components/`: the rack and one component per section. `Pane.astro` wraps each section.
- `src/scripts/rack.ts`: switching sections, patch cables, keyboard shortcuts.
- `src/styles/`: one stylesheet per area. `responsive.css` loads last so its media queries win.
- `test/`: unit tests for the rack layout. `e2e/`: Playwright, desktop and phone.

Adding a section means adding a server to `servers.ts` and a `Pane` with the same `id` to
`src/pages/index.astro`. The unit tests fail if the two disagree, if two servers share a
unit, or if one sticks out of the rack.

## Release and deploy

CI on Forgejo runs everything in `mise run check` plus the end-to-end suite. Deploying is
done by hand:

1. Move the `Unreleased` entries in `CHANGELOG.md` under a new dated version, and set the
   same version in `package.json`.
2. Commit, then tag `vX.Y.Z` and push the tag.
3. `mise run deploy` runs the checks and the end-to-end suite, builds, and rsyncs `dist/`
   to `/srv/www/arzaroth.com/htdocs` on the host. Shared downloads live outside the web
   root, in `/srv/www/arzaroth.com/files`, served under `/files/`.
