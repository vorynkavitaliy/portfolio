import { expect, test } from '@playwright/test';

import {
  announcer,
  autopilotCell,
  bootToHome,
  flyAway,
  headerButton,
  skipOutsideWorldProject,
} from '@tests/front/e2e/support/routes';
import { station } from '@tests/front/e2e/support/world';

test.beforeEach(({}, testInfo) => {
  skipOutsideWorldProject(testInfo);
});

test.describe.configure({ timeout: 240_000 });

test('hud.undock-keys: W, Enter, arrows and Shift while docked do not undock', async ({ page }) => {
  await bootToHome(page);

  for (const key of ['w', 'Enter', 'ArrowUp', 'ArrowLeft', 'Shift', 'a', 'd']) {
    await page.keyboard.press(key);
  }

  await page.waitForTimeout(500);
  await expect(station(page, 'home-base')).toHaveAttribute('data-docked', /.*/);
});

test('hud.undock-space-on-control: Space on a focused button does not undock', async ({ page }) => {
  await bootToHome(page);

  const sound = headerButton(page, /^Sound on$/);

  await sound.focus();
  await page.keyboard.press('Space');

  await expect(station(page, 'home-base')).toHaveAttribute('data-docked', /.*/);
  await expect(headerButton(page, /^Sound off$/)).toBeVisible();
});

test('hud.undock-space-body: Space and Esc on the body undock', async ({ page }) => {
  await bootToHome(page);

  await page.locator('body').press('Space');
  await expect(page.locator('section[data-station][data-docked]')).toHaveCount(0);
  await flyAway(page);

  await autopilotCell(page, 'home-base');
  await page.locator('body').press('Escape');
  await expect(page.locator('section[data-station][data-docked]')).toHaveCount(0);
});

test('hud.menu-triggers: header buttons wire aria-controls and toggle aria-expanded', async ({
  page,
}) => {
  await bootToHome(page);

  const autopilot = headerButton(page, /^Autopilot$/);
  const map = headerButton(page, /^Road map$/);

  await expect(autopilot).toHaveAttribute('aria-expanded', 'false');
  await expect(map).toHaveAttribute('aria-expanded', 'false');

  await map.click();
  await expect(map).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#road-map')).toBeFocused();

  await map.click();
  await expect(page.locator('#road-map')).toBeHidden();
  await expect(map).toHaveAttribute('aria-expanded', 'false');
});

test('hud.keyboard-walk: the whole HUD is reachable and operable by keyboard only', async ({
  page,
}) => {
  await bootToHome(page);

  const autopilot = headerButton(page, /^Autopilot$/);

  await autopilot.focus();
  await page.keyboard.press('Enter');

  const menu = page.locator('#autopilot-menu');

  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem').nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(menu.getByRole('menuitem').last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(menu.getByRole('menuitem').first()).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(menu).toBeHidden();
  await expect(autopilot).toBeFocused();

  await expect(station(page, 'full-cycle')).toHaveAttribute('data-docked', /.*/, {
    timeout: 90_000,
  });

  await expect(announcer(page)).toHaveText('Docked at Full cycle.');

  await page.keyboard.press('Tab');
  await expect(headerButton(page, /^Road map$/)).toBeFocused();
});
