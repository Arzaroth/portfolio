import { expect, test, type Page } from '@playwright/test';
import { keyOf, leaves, workspaces } from '../src/data/desktop';

const order = workspaces.map((w) => w.id);

async function expectOnly(page: Page, id: string) {
  await expect(page.locator('.ws.on')).toHaveCount(1);
  await expect(page.locator(`#${id}`)).toHaveClass(/\bon\b/);
  await expect(page.locator(`#${id} .win`).first()).toBeVisible();
  await expect(page.locator(`.ws-btn[data-go="${id}"]`)).toHaveAttribute('aria-current', 'page');
}

const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((a) => a.effect?.getTiming().iterations === Infinity || a.playState !== 'running'),
  );

async function openAll(page: Page) {
  if (!(await page.locator('.steps').isVisible())) return;
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const left = (await page.locator('.steps i').count()) - (await page.locator('.steps i.on').count());
  for (let i = 0; i < left; i++) await page.keyboard.press('j');
  await expect(page.locator('.ws.on > .win.pane-hidden')).toHaveCount(0);
}

const latestRelease = 'https://api.github.com/repos/Arzaroth/ouroboros/releases/latest';

async function expectFullCount(page: Page) {
  const counter = page.locator('#ouroboros [data-count]');
  const lines = Number(await counter.getAttribute('data-count'));
  expect(lines).toBeGreaterThan(25000);
  await expect(counter).toHaveText(lines.toLocaleString('en-US'));
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
  await page.route('https://api.github.com/**', (route) => route.abort());
});

test('opens on the hello workspace', async ({ page }) => {
  await page.goto('/');
  await expectOnly(page, 'about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Arzaroth');
});

test('switches to the workspace picked in the bar', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ws-btn[data-go="gauges"]').click();
  await expectOnly(page, 'gauges');
  await expect(page).toHaveURL(/#gauges$/);
});

test('opens the workspace named in the link', async ({ page }) => {
  await page.goto('/#ouroboros');
  await expectOnly(page, 'ouroboros');
  await expectFullCount(page);
});

test('an old link to the sealed names opens the workbench', async ({ page }) => {
  await page.goto('/#sealed');
  await expectOnly(page, 'workshop');
  await expect(page.locator('#workshop .sealed h3')).toHaveText(['Magister', 'Rackmancy']);
});

test('a tier under the pointer lights its arc on the ring', async ({ page }) => {
  await page.goto('/#ouroboros');
  await expectOnly(page, 'ouroboros');
  await openAll(page);
  await expect(page.locator('#ouroboros .ring .arc')).toHaveCount(8);
  await page.locator('#ouroboros .tiers li').nth(4).hover();
  await expect(page.locator('#ouroboros .ring .arc[data-tier="4"]')).toHaveClass(/\blit\b/);
  await expect(page.locator('#ouroboros .ring .arc.lit')).toHaveCount(1);
});

test('the line count follows the latest ouroboros release', async ({ page }) => {
  await page.route(latestRelease, (route) => route.fulfill({ json: { body: 'Prose.\n\nLOC: 31337\n' } }));
  await page.goto('/#ouroboros');
  await expect(page.locator('#ouroboros [data-count]')).toHaveText('31,337');
  await expect(page.locator('#ouroboros .links a')).toHaveText('Read all 31,337 lines');
});

test('the line count arriving after the workspace settled still lands', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  await page.route(latestRelease, async (route) => {
    await held;
    await route.fulfill({ json: { body: 'LOC: 31337' } });
  });
  await page.goto('/#ouroboros');
  await expectFullCount(page);
  release();
  await expect(page.locator('#ouroboros [data-count]')).toHaveText('31,337');
});

test('every window wears the colour of its workspace', async ({ page }) => {
  await page.goto('/');
  for (const id of order) {
    const want = await page.locator(`.ws-btn[data-go="${id}"]`).evaluate((b) => getComputedStyle(b).getPropertyValue('--c').trim());
    const got = await page.locator(`#${id} > .win`).evaluateAll((ws) => ws.map((w) => getComputedStyle(w).getPropertyValue('--acc').trim()));
    expect(got.length).toBeGreaterThan(0);
    for (const c of got) expect(c, id).toBe(want);
  }
});

test('the contribution counts follow GitHub', async ({ page }) => {
  const pull = (repo: string, created: string, merged: string | null) => ({
    repository_url: `https://api.github.com/repos/${repo}`,
    created_at: created,
    pull_request: { merged_at: merged },
  });
  await page.route('https://api.github.com/search/issues**', (route) =>
    route.fulfill({
      json: {
        items: [
          ...Array.from({ length: 30 }, () => pull('boubou666/doot', '2026-10-01T00:00:00Z', '2026-10-02T00:00:00Z')),
          pull('hyprwm/hyprsunset', '2025-08-14T00:00:00Z', null),
          pull('new/upstream', '2026-10-20T00:00:00Z', '2026-10-21T00:00:00Z'),
        ],
      },
    }),
  );
  await page.route('https://api.github.com/repos/*/*/contributors**', (route) =>
    route.fulfill({ json: [{ login: 'Arzaroth', contributions: 4242 }] }),
  );
  await page.goto('/#contributions');
  await expectOnly(page, 'contributions');
  await expect(page.locator('#contributions [data-repo="boubou666/doot"] [data-count]')).toHaveText('30');
  await expect(page.locator('#contributions [data-repo="Guillaume69/rocket-vibe"] [data-count]')).toHaveText('4,242');
  await expect(page.locator('#contributions .upstream .nm')).toHaveText(['upstream']);
});

test('the ps2 games share one browser, a tab each under its disc', async ({ page, isMobile }) => {
  await page.goto('/#recomp');
  await expectOnly(page, 'recomp');
  if (!isMobile) {
    await expect(page.locator('#recomp .win.master')).toHaveAttribute('aria-label', 'ps2recomp.md');
    await expect(page.locator('#recomp .win.focus')).toHaveAttribute('aria-label', 'ps2recomp.md');
  }
  await openAll(page);
  const tabs = page.locator('#recomp [role="tab"]');
  await expect(tabs).toHaveCount(3);
  await tabs.nth(0).click();
  const shown = page.locator('#recomp .panel:not([hidden])');
  await expect(shown.locator('.disc code')).toHaveText('SLUS-21216');
  await tabs.nth(2).click();
  await expect(shown.locator('.disc code')).toHaveText('SLPS-25545');
  await expect(shown.locator('h2')).toHaveText('Fighting for One Piece');
  const heights = [];
  for (let i = 0; i < 3; i++) {
    await tabs.nth(i).click();
    heights.push(await shown.locator('.hero').evaluate((e) => e.getBoundingClientRect().height));
  }
  expect(new Set(heights).size).toBe(1);
});

test('the rack in self-hosting is drawn in 3D, or falls back to the list', async ({ page }) => {
  await page.goto('/#selfhosted');
  await expectOnly(page, 'selfhosted');
  const view = page.locator('#selfhosted .rackview');
  await expect(view).toHaveClass(/\b(gl|no-gl)\b/);
  const items = page.locator('#selfhosted .svcs li');
  await expect(items).toHaveCount(21);
  if ((await view.getAttribute('class'))!.includes('no-gl')) return;
  await expect(page.locator('#selfhosted .rack3d canvas')).toBeVisible();
  await items.filter({ hasText: 'Password vault' }).hover();
  await expect(items.filter({ hasText: 'Password vault' })).toHaveClass(/\blit\b/);
});

test('an unknown link falls back to hello', async ({ page }) => {
  await page.goto('/#nothing-here');
  await expectOnly(page, 'about');
});

test('back and forward retrace the workspaces visited', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ws-btn[data-go="gauges"]').click();
  await expectOnly(page, 'gauges');
  await page.locator('.ws-btn[data-go="ouroboros"]').click();
  await expectOnly(page, 'ouroboros');
  await page.goBack();
  await expectOnly(page, 'gauges');
  await page.goBack();
  await expectOnly(page, 'about');
  await page.goForward();
  await expectOnly(page, 'gauges');
});

test('an unknown link does not leave a dead entry behind', async ({ page }) => {
  await page.goto('/#nothing-here');
  await expect(page).toHaveURL(/#about$/);
  await page.locator('.ws-btn[data-go="apps"]').click();
  await page.goBack();
  await expectOnly(page, 'about');
});

test('an unknown hash typed on hello is put back to hello', async ({ page }) => {
  await page.goto('/');
  await expectOnly(page, 'about');
  await page.evaluate(() => (location.hash = 'bogus'));
  await expect(page).toHaveURL(/#about$/);
  await expectOnly(page, 'about');
});

test('the workspace list on hello opens each workspace', async ({ page }) => {
  await page.goto('/');
  await openAll(page);
  await page.locator('#about .row[data-go="contributions"]').click();
  await expectOnly(page, 'contributions');
  const doot = page.locator('#contributions [data-repo="boubou666/doot"] [data-count]');
  await expect(doot).toHaveText(Number(await doot.getAttribute('data-count')).toLocaleString('en-US'));
});

test('a terminal prints a sample of the program typed', async ({ page }) => {
  await page.goto('/#tools');
  await expectOnly(page, 'tools');
  const term = page.locator('#tools .win', { hasText: 'resumove' }).first();
  const cli = term.locator('.cli');
  await cli.fill('resumove');
  await cli.press('Enter');
  await expect(term.locator('.log .out')).toContainText('rewrote 214 recorded paths');
  await expect(term.locator('.rp .st')).toHaveText('\u2714');
  await cli.fill('vim');
  await cli.press('Enter');
  await expect(term.locator('.log .out.err')).toHaveText('zsh: command not found: vim');
  await expect(term.locator('.rp .st')).toHaveText('127 \u2718');
  await cli.fill('clear');
  await cli.press('Enter');
  await expect(term.locator('.log')).toBeEmpty();
});

test('the rack in fastfetch has a unit per workspace, in its colour', async ({ page }) => {
  await page.goto('/');
  const units = page.locator('#about .fetch svg rect[rx="1.5"]');
  await expect(units).toHaveCount(workspaces.length);
  await expect(page.locator('#about .swatches i')).toHaveCount(workspaces.length);
  const fills = await units.evaluateAll((rs) => rs.map((r) => r.getAttribute('fill')));
  expect(fills).toEqual(workspaces.map((w) => `var(--${w.color})`));
});

test('tab completes the program name', async ({ page }) => {
  await page.goto('/#about');
  const cli = page.locator('#about .cli');
  await cli.fill('fast');
  await cli.press('Tab');
  await expect(cli).toHaveValue('fastfetch ');
  await cli.press('Enter');
  await expect(page.locator('#about .log dd').first()).toHaveText('CISO');
});

test('the gauges share one terminal, a tab each', async ({ page }) => {
  await page.goto('/#gauges');
  await expectOnly(page, 'gauges');
  const tabs = page.locator('#gauges [role="tab"]');
  await expect(tabs).toHaveText(['TokenGauge', 'remuda', 'TailGauge', 'smith', 'wyrmyon']);
  await expect(page.locator('#gauges .panel:not([hidden])')).toHaveCount(1);
  await expect(page.locator('#gauges .panel:not([hidden]) h2')).toHaveText('TokenGauge');
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#gauges .panel:not([hidden]) h2')).toHaveText('remuda');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#gauges .panel:not([hidden]) h2')).toHaveText('TailGauge');
  await expect(tabs.nth(2)).toBeFocused();
  const cli = page.locator('#gauges .panel:not([hidden]) .cli');
  await cli.fill('tailgauge');
  await cli.press('Enter');
  await expect(page.locator('#gauges .panel:not([hidden]) .log .out')).toContainText('connected');
});

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'tiling and keyboard are desktop only');

  test('ctrl and a number walk every workspace', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.bar .mod')).toHaveText('ctrl');
    for (const [i, id] of order.entries()) {
      await page.keyboard.press(`Control+${keyOf(i)}`);
      await expectOnly(page, id);
    }
  });

  test('the window under the pointer takes the focus, and its terminal the keyboard', async ({ page }) => {
    await page.goto('/#tools');
    await expectOnly(page, 'tools');
    await openAll(page);
    await page.waitForTimeout(600);
    const t3cc = page.locator('#tools .win[aria-label="t3cc"]');
    await t3cc.hover();
    await expect(t3cc).toHaveClass(/\bfocus\b/);
    await expect(t3cc.locator('.cli')).toBeFocused();
    await expect(page.locator('.bar-title b')).toHaveText('t3cc');
    await page.keyboard.type('t3cc');
    await page.keyboard.press('Enter');
    await expect(t3cc.locator('.log .out')).toContainText('imported 12 threads');
  });

  test('tab and shift tab move between the gauge tabs, each shown from its bottom', async ({ page }) => {
    await page.goto('/#gauges');
    await expectOnly(page, 'gauges');
    await page.waitForTimeout(600);
    const gauges = page.locator('#gauges .win.tabbed');
    await gauges.hover();
    const shown = page.locator('#gauges .panel:not([hidden]) h2');
    await expect(shown).toHaveText('TokenGauge');
    await page.keyboard.press('Tab');
    await expect(shown).toHaveText('remuda');
    await expect(page.locator('#gauges .panel:not([hidden]) .cli')).toBeFocused();
    const gap = await gauges.locator('.body').evaluate((b) => b.scrollHeight - b.clientHeight - b.scrollTop);
    expect(gap).toBeLessThanOrEqual(1);
    for (const name of ['TailGauge', 'smith', 'wyrmyon', 'TokenGauge']) {
      await page.keyboard.press('Tab');
      await expect(shown).toHaveText(name);
    }
    await page.keyboard.press('Shift+Tab');
    await expect(shown).toHaveText('wyrmyon');
  });

  test('without the pointer on it, tab leaves the gauges window as usual', async ({ page }) => {
    await page.goto('/#gauges');
    await page.locator('#gauges [role="tab"]').first().focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#gauges .panel:not([hidden]) h2')).toHaveText('TokenGauge');
    await expect(page.locator('#gauges [role="tab"]').first()).not.toBeFocused();
  });

  test('tab completes a name before it changes tab', async ({ page }) => {
    await page.goto('/#gauges');
    await page.waitForTimeout(600);
    await page.locator('#gauges .win.tabbed').hover();
    await page.keyboard.type('token');
    await page.keyboard.press('Tab');
    await expect(page.locator('#gauges .panel:not([hidden]) .cli')).toHaveValue('tokengauge ');
    await expect(page.locator('#gauges .panel:not([hidden]) h2')).toHaveText('TokenGauge');
  });

  test('m swaps the focused window into the main tile, and l moves the focus', async ({ page }) => {
    await page.goto('/#tools');
    await expectOnly(page, 'tools');
    await openAll(page);
    const main = page.locator('#tools .win.master');
    await expect(main).toHaveAttribute('aria-label', 'c2c-conv');
    await page.keyboard.press('l');
    await expect(page.locator('#tools .win.focus')).not.toHaveAttribute('aria-label', 'c2c-conv');
    const picked = await page.locator('#tools .win.focus').getAttribute('aria-label');
    await page.keyboard.press('m');
    await expect(main).toHaveAttribute('aria-label', picked!);
    await expect(page.locator('.bar-title b')).toHaveText(picked!);
  });

  test('typing in a terminal takes letters and digits, and ctrl still switches', async ({ page }) => {
    await page.goto('/#tools');
    const cli = page.locator('#tools .cli').first();
    await cli.click();
    await page.keyboard.type('hjkl m 2');
    await expect(cli).toHaveValue('hjkl m 2');
    await expectOnly(page, 'tools');
    await page.keyboard.press('Control+2');
    await expectOnly(page, 'apps');
  });

  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  test('the Konami code lets the windows float, and Esc tiles them back', async ({ page }) => {
    await page.goto('/#apps');
    await expectOnly(page, 'apps');
    await settled(page);
    const tiled = () => page.locator('#apps > .win').evaluateAll((ws) => ws.map((w) => [w.style.left, w.style.top, w.style.width, w.style.height].join()));
    const before = await tiled();
    for (const k of konami) await page.keyboard.press(k);
    await expect(page.locator('#apps')).toHaveClass(/\bfloating\b/);
    await expect(page.locator('.toast')).toBeVisible();
    await expect(page.locator('.toast b')).toHaveText('Floating mode');
    await expect.poll(tiled).not.toEqual(before);
    await page.keyboard.press('Escape');
    await expect(page.locator('#apps')).not.toHaveClass(/\bfloating\b/);
    await expect(page.locator('.toast')).toBeHidden();
    await expect.poll(tiled).toEqual(before);
  });

  test('another workspace ends floating mode', async ({ page }) => {
    await page.goto('/#apps');
    await settled(page);
    for (const k of konami) await page.keyboard.press(k);
    await expect(page.locator('#apps')).toHaveClass(/\bfloating\b/);
    await page.keyboard.press('Control+3');
    await expectOnly(page, 'gauges');
    await expect(page.locator('.ws.floating')).toHaveCount(0);
  });

  test('the code typed in a terminal leaves its prompt clean', async ({ page }) => {
    await page.goto('/#tools');
    const cli = page.locator('#tools .cli').first();
    await cli.click();
    await cli.fill('t3');
    for (const k of konami) await page.keyboard.press(k);
    await expect(page.locator('#tools')).toHaveClass(/\bfloating\b/);
    await expect(cli).toHaveValue('t3');
  });

  const open = (page: Page) => page.locator('.ws.on > .win:not(.pane-hidden)');

  test('the first view opens on the main window, and a workspace reached directly opens whole', async ({ page }) => {
    await page.goto('/#tools');
    await expectOnly(page, 'tools');
    await expect(open(page)).toHaveCount(1);
    await page.keyboard.press('Control+7');
    await expectOnly(page, 'recomp');
    await expect(open(page)).toHaveCount(2);
    await page.locator('.ws-btn[data-go="apps"]').click();
    await expectOnly(page, 'apps');
    await expect(open(page)).toHaveCount(4);
  });

  test('j and k open and close the windows one by one, and carry on across workspaces', async ({ page }) => {
    await page.goto('/#tools');
    await expectOnly(page, 'tools');
    await expect(page.locator('.steps i')).toHaveCount(4);
    await openAll(page);
    for (const n of [3, 2, 1]) {
      await page.keyboard.press('k');
      await expect(open(page)).toHaveCount(n);
      await expect(page.locator('.steps i.on')).toHaveCount(n);
    }
    await page.keyboard.press('k');
    await expectOnly(page, 'gauges');
    await expect(open(page)).toHaveCount(3);
    await page.keyboard.press('j');
    await expectOnly(page, 'tools');
    await expect(open(page)).toHaveCount(1);
    for (const n of [2, 3, 4]) {
      await page.keyboard.press('j');
      await expect(open(page)).toHaveCount(n);
    }
    await page.keyboard.press('j');
    await expectOnly(page, 'workshop');
    await expect(open(page)).toHaveCount(1);
  });

  test('stepping walks the tabs of a tabbed window before the next window', async ({ page }) => {
    await page.goto('/#apps');
    await expectOnly(page, 'apps');
    await openAll(page);
    await page.keyboard.press('j');
    await expectOnly(page, 'gauges');
    const shown = page.locator('#gauges .panel:not([hidden]) h2');
    await expect(shown).toHaveText('TokenGauge');
    for (const name of ['remuda', 'TailGauge', 'smith', 'wyrmyon']) {
      await page.keyboard.press('j');
      await expect(shown).toHaveText(name);
    }
    await expect(open(page)).toHaveCount(1);
    await page.keyboard.press('j');
    await expect(open(page)).toHaveCount(2);
    await page.keyboard.press('k');
    await page.keyboard.press('k');
    await expect(shown).toHaveText('smith');
    await expect(open(page)).toHaveCount(1);
  });

  test('a workspace reached directly shows every step done', async ({ page }) => {
    await page.goto('/#about');
    await page.keyboard.press('Control+3');
    await expectOnly(page, 'gauges');
    await expect(page.locator('.steps i')).toHaveCount(7);
    await expect(page.locator('.steps i:not(.on)')).toHaveCount(0);
  });

  test('the wheel over the wallpaper opens and closes the windows', async ({ page }) => {
    await page.goto('/#selfhosted');
    await expectOnly(page, 'selfhosted');
    await settled(page);
    await page.mouse.move(700, 30);
    await page.mouse.wheel(0, 150);
    await expect(open(page)).toHaveCount(2);
    await page.waitForTimeout(600);
    await page.mouse.wheel(0, -150);
    await expect(open(page)).toHaveCount(1);
  });

  test('the wheel scrolls a long window before it steps', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 560 } });
    const page = await context.newPage();
    await page.route('https://api.github.com/**', (route) => route.abort());
    await page.goto('/#ouroboros');
    await expectOnly(page, 'ouroboros');
    await openAll(page);
    await settled(page);
    const tiers = page.locator('#ouroboros .win[aria-label="tiers.md"] .body');
    expect(await tiers.evaluate((b) => b.scrollHeight - b.clientHeight)).toBeGreaterThan(0);
    await tiers.hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => tiers.evaluate((b) => b.scrollTop)).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    await expectOnly(page, 'ouroboros');
    await expect(page.locator('#ouroboros > .win.pane-hidden')).toHaveCount(0);
    await context.close();
  });

  test('tabbing into a closed window opens it', async ({ page }) => {
    await page.goto('/#about');
    await expectOnly(page, 'about');
    await expect(page.locator('#about .win[aria-label="~/workspaces"]')).toHaveClass(/pane-hidden/);
    await page.locator('#about .row[data-go="apps"]').focus();
    await expect(page.locator('#about .win[aria-label="~/workspaces"]')).not.toHaveClass(/pane-hidden/);
  });

  test('floating mode opens every window, and closes again the ones that were closed', async ({ page }) => {
    await page.goto('/#apps');
    await expectOnly(page, 'apps');
    await page.keyboard.press('j');
    await expect(open(page)).toHaveCount(2);
    for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await page.keyboard.press(k);
    await expect(page.locator('#apps')).toHaveClass(/\bfloating\b/);
    await expect(page.locator('#apps > .win.pane-hidden')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(open(page)).toHaveCount(2);
  });

  test('the spinning disc never pushes a scrollbar out of its window', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1100, height: 700 } });
    const page = await context.newPage();
    await page.route('https://api.github.com/**', (route) => route.abort());
    await page.goto('/#recomp');
    await expectOnly(page, 'recomp');
    const body = page.locator('#recomp .win.recomp .body');
    for (let i = 0; i < 12; i++) {
      expect(await body.evaluate((b) => b.scrollHeight - b.clientHeight)).toBeLessThanOrEqual(0);
      await page.waitForTimeout(250);
    }
    await context.close();
  });

  test('every window edge lands on a screen pixel when the display is scaled', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1.25 });
    const page = await context.newPage();
    await page.route('https://api.github.com/**', (route) => route.abort());
    for (const id of order) {
      await page.goto(`/#${id}`);
      await expectOnly(page, id);
      await openAll(page);
      await settled(page);
      const edges = await page.locator(`#${id} > .win`).evaluateAll((ws) =>
        ws.flatMap((w) => {
          const r = w.getBoundingClientRect();
          return [r.left, r.top, r.right, r.bottom].map((v) => v * devicePixelRatio);
        }),
      );
      for (const e of edges) expect(Math.abs(e - Math.round(e)), `${id}: ${e}`).toBeLessThan(0.05);
    }
    await context.close();
  });

  test('the windows tile the desk without overlapping', async ({ page }) => {
    for (const id of order) {
      await page.goto(`/#${id}`);
      await expectOnly(page, id);
      await openAll(page);
      await settled(page);
      await expect(page.locator(`#${id} > .win`)).toHaveCount(leaves(workspaces[order.indexOf(id)].tree).length);
      const boxes = await page.locator(`#${id} > .win`).evaluateAll((ws) =>
        ws.map((w) => {
          const r = w.getBoundingClientRect();
          return { l: r.left, t: r.top, r: r.right, b: r.bottom };
        }),
      );
      for (const [i, a] of boxes.entries()) {
        expect(a.r - a.l, `${id}: window ${i} width`).toBeGreaterThan(200);
        for (const b of boxes.slice(i + 1)) {
          const apart = a.r <= b.l + 0.5 || b.r <= a.l + 0.5 || a.b <= b.t + 0.5 || b.b <= a.t + 0.5;
          expect(apart, `${id}: windows overlap`).toBe(true);
        }
      }
    }
  });
});

test.describe('phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone layout only');

  test('the windows stack and nothing scrolls sideways', async ({ page }) => {
    await page.goto('/#apps');
    await expectOnly(page, 'apps');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const lefts = await page.locator('#apps > .win').evaluateAll((ws) => ws.map((w) => Math.round(w.getBoundingClientRect().left)));
    expect(new Set(lefts).size).toBe(1);
    await page.locator('.ws-btn[data-go="archive"]').click();
    await expectOnly(page, 'archive');
  });
});

test('every window shows at once on a phone and with reduced motion', async ({ browser, isMobile }) => {
  const context = await browser.newContext(isMobile ? {} : { reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.route('https://api.github.com/**', (route) => route.abort());
  await page.goto('/#selfhosted');
  await expect(page.locator('#selfhosted > .win')).toHaveCount(5);
  await expect(page.locator('#selfhosted > .win.pane-hidden')).toHaveCount(0);
  await expect(page.locator('.steps')).toBeHidden();
  await context.close();
});

test('with reduced motion, the counts land at once', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route('https://api.github.com/**', (route) => route.abort());
  await page.goto('/#ouroboros');
  await expectFullCount(page);
  await context.close();
});
