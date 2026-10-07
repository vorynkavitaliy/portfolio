import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import {
  announcer,
  autopilotCell,
  barCell,
  bootToHome,
  dockedPanel,
  expectUndocked,
  flyAway,
  headerButton,
  HOME_DOCK_MS,
  linked,
  skipOutsideWorldProject,
  STATION_KEYS,
} from '@tests/front/e2e/support/routes';
import {
  counter,
  flyTo,
  openWorld,
  station,
  takeOffButton,
  waitDocked,
  waitReady,
} from '@tests/front/e2e/support/world';

test.beforeEach(({}, testInfo) => {
  skipOutsideWorldProject(testInfo);
});

test.describe.configure({ timeout: 240_000 });

test('world.take-off: enabled when ready, Home docks within 3 s, Linked 1/9', async ({ page }) => {
  await openWorld(page);
  await waitReady(page);
  await expect(takeOffButton(page)).toBeEnabled();

  const startedAt: number = Date.now();

  await takeOffButton(page).click();
  await waitDocked(page, 'home-base', HOME_DOCK_MS);

  const dockMs: number = Date.now() - startedAt;

  test.info().annotations.push({ type: 'home-dock-ms', description: String(dockMs) });

  await expect(counter(page)).toHaveText('Linked 1/9');
  await expect(announcer(page)).toHaveText('Docked at Home base.');
  await expect(barCell(page, 'home-base')).toHaveAttribute('aria-current', 'true');
});

test('world.sound: on and pressed after Take off, off via the toggle', async ({ page }) => {
  await bootToHome(page);

  const sound = headerButton(page, /^Sound on$/);

  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await sound.click();

  const off = headerButton(page, /^Sound off$/);

  await expect(off).toHaveAttribute('aria-pressed', 'false');
});

test('world.fly-keys: keys only to LLM product docks, Linked 2/9', async ({ page }) => {
  await bootToHome(page);

  await page.keyboard.press('Space');
  await expectUndocked(page);

  const startedAt: number = Date.now();

  await flyTo(page, 'llm-product');
  await waitDocked(page, 'llm-product');

  test
    .info()
    .annotations.push({ type: 'fly-llm-product-ms', description: String(Date.now() - startedAt) });

  await expect(linked(page, 2)).toBeVisible();
  await expect(announcer(page)).toHaveText('Docked at LLM product.');
  await expect(barCell(page, 'llm-product')).toHaveAttribute('aria-current', 'true');
});

test('world.take-off-paths: Space, Esc and the panel button each undock and bring the hint back', async ({
  page,
}) => {
  await bootToHome(page);

  const hint = page.getByText(/Fly with WASD/);

  await expect(page.getByText(/Docked\. Read on/)).toBeVisible();

  await page.keyboard.press('Space');
  await expectUndocked(page);
  await expect(hint).toBeVisible();
  await flyAway(page);

  await autopilotCell(page, 'home-base');
  await page.keyboard.press('Escape');
  await expectUndocked(page);
  await expect(hint).toBeVisible();
  await flyAway(page);

  await autopilotCell(page, 'home-base');

  await station(page, 'home-base')
    .getByRole('button', { name: /take off/i })
    .click();

  await expectUndocked(page);
  await expect(hint).toBeVisible();

  await expect(linked(page, 1)).toBeVisible();
});

test('world.focus: only the docked panel is focusable; announcer names the station', async ({
  page,
}) => {
  await bootToHome(page);

  await expect(dockedPanel(page)).toHaveCount(1);

  const panels = page.locator('section[data-station]');

  await expect(panels).toHaveCount(STATION_KEYS.length);

  for (const id of STATION_KEYS) {
    const inert: string | null = await station(page, id).getAttribute('inert');

    if (id === 'home-base') {
      expect(inert).toBeNull();
    } else {
      expect(inert).not.toBeNull();
    }
  }

  await autopilotCell(page, 'contact');
  await expect(announcer(page)).toHaveText('Docked at Contact.');
  await expect(station(page, 'home-base')).not.toHaveAttribute('data-docked', /.*/);
  await expect(station(page, 'home-base')).toHaveAttribute('inert', /.*/);
  await expect(station(page, 'contact')).not.toHaveAttribute('inert', /.*/);
});

test('world.typing: keys are ignored while typing in the form', async ({ page }) => {
  await bootToHome(page);
  await autopilotCell(page, 'contact');

  const name = station(page, 'contact').getByRole('textbox').first();

  await name.focus();
  await page.keyboard.type('w a s d Shift');
  await page.keyboard.press('Space');

  await expect(name).toHaveValue('w a s d Shift ');
  await expect(dockedPanel(page)).toHaveCount(1);
  await expect(station(page, 'contact')).toHaveAttribute('data-docked', /.*/);
});

test('world.text-roundtrip: text and back keeps the docked station and the counter', async ({
  page,
}) => {
  await bootToHome(page);
  await autopilotCell(page, 'marketplace-chat');
  await expect(linked(page, 2)).toBeVisible();

  await headerButton(page, /^Text version$/).click();
  await expect(page.locator('section[data-station][inert]')).toHaveCount(0);

  await headerButton(page, /^3D world$/).click();

  await expect(station(page, 'marketplace-chat')).toHaveAttribute('data-docked', /.*/);
  await expect(linked(page, 2)).toBeVisible();
});

test('world.parity: the visible panel is #<id> from the text version', async ({ page }) => {
  await bootToHome(page);

  const textIds: string[] = await page.locator('section[data-station]').evaluateAll((nodes) => {
    return nodes.map((node) => {
      return node.id;
    });
  });

  expect(textIds).toEqual(STATION_KEYS);

  await expect(page.locator('#home-base[data-docked]')).toBeVisible();

  await autopilotCell(page, 'systems');
  await expect(page.locator('#systems[data-docked]')).toBeVisible();
  await expect(page.locator('#home-base')).toBeHidden();
});

test('world.axe: no violations with Home docked', async ({ page }) => {
  await bootToHome(page);

  const results = await new AxeBuilder({ page }).analyze();

  const ids: string[] = results.violations.map((violation) => {
    return violation.id;
  });

  expect(ids).toEqual([]);
});
