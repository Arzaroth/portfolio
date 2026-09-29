import { expect, test, type Page } from '@playwright/test';

const order = ['about', 'apps', 'gauges', 'workshop', 'ouroboros', 'selfhosted', 'contributions', 'archive'];

const visiblePanes = (page: Page) => page.locator('.pane:not([hidden])');

async function expectOnly(page: Page, id: string) {
  await expect(visiblePanes(page)).toHaveCount(1);
  await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator(`.dev[data-to="${id}"]`)).toHaveAttribute('aria-current', 'page');
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
});

test('opens on the hello server', async ({ page }) => {
  await page.goto('/');
  await expectOnly(page, 'about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Arzaroth');
});

test('powers up the server that is clicked', async ({ page }) => {
  await page.goto('/');
  await page.locator('.dev[data-to="gauges"]').click();
  await expectOnly(page, 'gauges');
  await expect(page).toHaveURL(/#gauges$/);
  await expect(page.locator('.dev.on')).toHaveCount(1);
});

test('opens the server named in the link', async ({ page }) => {
  await page.goto('/#ouroboros');
  await expectOnly(page, 'ouroboros');
  await expect(page.locator('#ouroboros [data-count]')).toHaveText('25,192');
});

test('an unknown link falls back to hello', async ({ page }) => {
  await page.goto('/#nothing-here');
  await expectOnly(page, 'about');
});

test('back and forward retrace the servers visited', async ({ page }) => {
  await page.goto('/');
  await page.locator('.dev[data-to="gauges"]').click();
  await expectOnly(page, 'gauges');
  await page.locator('.dev[data-to="ouroboros"]').click();
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
  await page.locator('.dev[data-to="apps"]').click();
  await page.goBack();
  await expectOnly(page, 'about');
});

test('next server walks the whole rack and wraps', async ({ page }) => {
  await page.goto('/');
  for (const id of [...order.slice(1), order[0]]) {
    await page.locator('.pane:not([hidden]) .next button').click();
    await expectOnly(page, id);
  }
});

test('the index on hello opens each section', async ({ page }) => {
  await page.goto('/');
  await page.locator('#about .index button[data-go="contributions"]').click();
  await expectOnly(page, 'contributions');
  await expect(page.locator('#contributions [data-count]').first()).toHaveText('23');
});

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard and cables are desktop only');

  test('j and k move between servers', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('j');
    await expectOnly(page, 'apps');
    await page.keyboard.press('j');
    await expectOnly(page, 'gauges');
    await page.keyboard.press('k');
    await page.keyboard.press('k');
    await page.keyboard.press('k');
    await expectOnly(page, 'archive');
  });

  test('arrow keys move focus along the rack', async ({ page }) => {
    await page.goto('/');
    await page.locator('.dev[data-to="apps"]').focus();
    await page.keyboard.press('ArrowDown');
    await expectOnly(page, 'gauges');
    await expect(page.locator('.dev[data-to="gauges"]')).toBeFocused();
  });

  test('every server is patched, and only the active cable carries traffic', async ({ page }) => {
    await page.goto('/#selfhosted');
    await expectOnly(page, 'selfhosted');
    const wires = page.locator('.wires g');
    await expect(wires).toHaveCount(order.length);
    for (const id of order) {
      await expect(page.locator(`.wires g[data-to="${id}"] .w`)).toHaveAttribute('d', /^M/);
    }
    await expect(page.locator('.wires .pk[d^="M"]')).toHaveCount(1);
    await expect(page.locator('.wires g[data-to="selfhosted"] .pk')).toHaveAttribute('d', /^M/);
    await expect(page.locator('.pport.on')).toHaveAttribute('data-to', 'selfhosted');
  });
});

test.describe('phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone layout only');

  test('the servers become a strip and nothing scrolls sideways', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.wires')).toBeHidden();
    await expect(page.locator('.patchbar')).toBeHidden();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.locator('.dev[data-to="archive"]').click();
    await expectOnly(page, 'archive');
  });
});

test('with reduced motion, everything is visible at once', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/#ouroboros');
  await expect(page.locator('#ouroboros [data-count]')).toHaveText('25,192');
  const opacity = await page.locator('#ouroboros .tiers li').last().evaluate((el) => getComputedStyle(el).opacity);
  expect(opacity).toBe('1');
  await context.close();
});
