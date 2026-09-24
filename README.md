# portfolio

Arzaroth's page, laid out as a 42U rack. Each section is a server in the rack.

## Develop

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview
```

## Where things live

- `src/data/servers.ts`: the rack. Each server's slot, height, cable colour and port count.
- `src/data/projects.ts`: every piece of copy on the page.
- `src/components/`: the rack and one component per section. `Pane.astro` wraps each section.
- `src/scripts/rack.ts`: switching sections, patch cables, keyboard shortcuts (J/K, arrows on a server).
- `src/styles/`: one stylesheet per area. `responsive.css` loads last so its media queries win.

Adding a section means adding a server to `servers.ts` and a `Pane` with the same `id` to `src/pages/index.astro`.
