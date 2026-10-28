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

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'tiling and keyboard are desktop only');

  test('number keys walk every workspace', async ({ page }) => {
    await page.goto('/');
    for (const [i, id] of order.entries()) {
      await page.keyboard.press(String(i + 1));
      await expectOnly(page, id);
    }
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
