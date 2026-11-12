import { expect, test } from '@playwright/test';
import { labelOf, pickable } from '../src/data/room';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
});

const powered = (page: import('@playwright/test').Page) => expect(page.locator('.rk-loading')).toHaveCount(0, { timeout: 20000 });

test('opens on the room, with the rack powered on', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Arzaroth');
  await powered(page);
  await expect(page.locator('#rack')).toHaveClass(/\blive\b/);
  await expect(page.locator('#rk-canvas')).toBeVisible();
});

test('lists every server in the rack, top to bottom', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.rk-inv a')).toHaveText(pickable.map(labelOf));
});

test('a server picked in the list opens its card, and the close button puts it back', async ({ page }) => {
  await page.goto('/');
  await powered(page);
  await page.locator('.rk-inv a[data-id="tokengauge"]').click();
  const card = page.locator('.rk-card');
  await expect(card).toHaveClass(/\bopen\b/);
  await expect(card.getByRole('heading', { level: 2 })).toHaveText('TokenGauge');
  await expect(card.locator('.slot')).toHaveText('U26-27');
  await expect(page.locator('.rk-inv a[data-id="tokengauge"]')).toHaveAttribute('aria-current', 'true');
  await card.getByRole('button', { name: 'Push it back in' }).click();
  await expect(card).not.toHaveClass(/\bopen\b/);
});

test('escape closes the card', async ({ page }) => {
  await page.goto('/');
  await powered(page);
  await page.locator('.rk-inv a[data-id="cat"]').click();
  await expect(page.locator('.rk-card h2')).toHaveText('The cat');
  await page.keyboard.press('Escape');
  await expect(page.locator('.rk-card')).not.toHaveClass(/\bopen\b/);
});

test('j and k walk the rack, top to bottom', async ({ page }) => {
  await page.goto('/');
  await powered(page);
  await page.keyboard.press('j');
  await expect(page.locator('.rk-card.open h2')).toHaveText('Code lives at home too');
  await page.keyboard.press('j');
  await expect(page.locator('.rk-card.open h2')).toHaveText('smith');
  await page.keyboard.press('k');
  await expect(page.locator('.rk-card.open h2')).toHaveText('Code lives at home too');
});

test('a link to a server opens with that server pulled out', async ({ page }) => {
  await page.goto('/#server-ouroboros');
  await expect(page.locator('.rk-card.open h2')).toHaveText('ouroboros', { timeout: 20000 });
});

test('the Konami code boots a machine into the old desktop, inside the page, and its logo leads back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await powered(page);
  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await page.keyboard.press(key);
  await expect(page.locator('.rk-boot')).toContainText('ARZAROTH BIOS');
  const desktop = page.locator('.rk-desktop');
  await expect(desktop).toBeVisible({ timeout: 20000 });
  await expect(page).toHaveURL(/:\d+\/$/);
  const frame = page.frameLocator('.rk-desktop');
  await expect(frame.locator('.bar')).toBeVisible();
  await frame.getByRole('link', { name: 'Back to the room' }).click();
  await expect(desktop).toBeHidden();
  await expect(page.locator('#rk-canvas')).toBeVisible();
});

test('escape backs out of the boot', async ({ page }) => {
  await page.goto('/');
  await powered(page);
  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await page.keyboard.press(key);
  await expect(page.locator('.rk-boot')).toBeVisible({ timeout: 10000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('.rk-boot')).toBeHidden();
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/:\d+\/$/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every server is a card on the page, and the list links to it', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.rk-entries .rk-entry')).toHaveCount(pickable.length);
    await expect(page.locator('#rk-canvas')).toBeHidden();
    await page.locator('.rk-inv a[data-id="upstream"]').click();
    await expect(page).toHaveURL(/#server-upstream$/);
    await expect(page.locator('#server-upstream')).toBeInViewport();
  });
});
