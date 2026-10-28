import { expect, test, type Page } from '@playwright/test';

const order = ['about', 'apps', 'gauges', 'tools', 'workshop', 'ouroboros', 'selfhosted', 'contributions', 'archive'];

async function expectOnly(page: Page, id: string) {
  await expect(page.locator('.ws.on')).toHaveCount(1);
  await expect(page.locator(`#${id}`)).toHaveClass(/\bon\b/);
  await expect(page.locator(`#${id} .win`).first()).toBeVisible();
  await expect(page.locator(`.ws-btn[data-go="${id}"]`)).toHaveAttribute('aria-current', 'page');
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
  await page.route(latestRelease, (route) => route.abort());
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
  await page.locator('#about .row[data-go="contributions"]').click();
  await expectOnly(page, 'contributions');
  await expect(page.locator('#contributions [data-count]').first()).toHaveText('23');
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
  await expect(tabs).toHaveText(['TokenGauge', 'remuda', 'TailGauge']);
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
      await page.keyboard.press(`Control+${i + 1}`);
      await expectOnly(page, id);
    }
  });

  test('the window under the pointer takes the focus, and its terminal the keyboard', async ({ page }) => {
    await page.goto('/#tools');
    await expectOnly(page, 'tools');
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
    await page.keyboard.press('Tab');
    await expect(shown).toHaveText('TailGauge');
    await page.keyboard.press('Tab');
    await expect(shown).toHaveText('TokenGauge');
    await page.keyboard.press('Shift+Tab');
    await expect(shown).toHaveText('TailGauge');
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

  test('every window edge lands on a screen pixel when the display is scaled', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1.25 });
    const page = await context.newPage();
    await page.route(latestRelease, (route) => route.abort());
    for (const id of order) {
      await page.goto(`/#${id}`);
      await expectOnly(page, id);
      await page.waitForTimeout(600);
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
      await page.waitForTimeout(600);
      const boxes = await page.locator(`#${id} > .win`).evaluateAll((ws) =>
        ws.map((w) => {
          const r = w.getBoundingClientRect();
          return { l: r.left, t: r.top, r: r.right, b: r.bottom };
        }),
      );
      for (const [i, a] of boxes.entries()) {
        expect(a.r - a.l).toBeGreaterThan(200);
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

test('with reduced motion, the counts land at once', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route(latestRelease, (route) => route.abort());
  await page.goto('/#ouroboros');
  await expectFullCount(page);
  await context.close();
});
