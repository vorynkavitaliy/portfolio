import { expect, test } from '@playwright/test';

import type { Locator } from '@playwright/test';

import {
  announcer,
  AUTOPILOT_DOCK_MS,
  autopilotCell,
  barCell,
  bootToHome,
  expectUndocked,
  headerButton,
  linked,
  skipOutsideWorldProject,
} from '@tests/front/e2e/support/routes';
import { station, waitDocked } from '@tests/front/e2e/support/world';

test.beforeEach(({}, testInfo) => {
  skipOutsideWorldProject(testInfo);
});

test.describe.configure({ timeout: 300_000 });

test('autopilot.menu: opens with 9 items, first focused; choosing flies, closes and returns focus', async ({
  page,
}) => {
  await bootToHome(page);

  const trigger = headerButton(page, /^Autopilot$/);
  const menu = page.locator('#autopilot-menu');

  await trigger.click();
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('role', 'menu');
  await expect(menu.getByRole('menuitem')).toHaveCount(9);
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-controls', 'autopilot-menu');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  const startedAt: number = Date.now();

  await menu.getByRole('menuitem', { name: /LLM product/ }).click();
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expectUndocked(page);
  await waitDocked(page, 'llm-product', AUTOPILOT_DOCK_MS);

  test
    .info()
    .annotations.push({ type: 'autopilot-menu-ms', description: String(Date.now() - startedAt) });

  await expect(linked(page, 2)).toBeVisible();
});

test('autopilot.menu-esc: Esc with the menu open closes it and does not undock', async ({
  page,
}) => {
  await bootToHome(page);

  const menu = page.locator('#autopilot-menu');

  await headerButton(page, /^Autopilot$/).click();
  await expect(menu).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(menu).toBeHidden();
  await expect(station(page, 'home-base')).toHaveAttribute('data-docked', /.*/);
});

test('autopilot.bar: a bar cell docks, steering cancels autopilot', async ({ page }) => {
  await bootToHome(page);

  await expect(page.locator('[data-station-cell]')).toHaveCount(9);

  await barCell(page, 'contact').click();
  await expectUndocked(page);

  await page.keyboard.down('a');
  await page.waitForTimeout(3_000);
  await page.keyboard.up('a');

  await page.waitForTimeout(2_000);
  await expectUndocked(page);
  await expect(announcer(page)).toHaveText('');
});

test('autopilot.docks: three further docks give Linked 4/9, a re-dock keeps the count', async ({
  page,
}) => {
  await bootToHome(page);

  await autopilotCell(page, 'llm-product');
  await autopilotCell(page, 'marketplace-chat');
  await autopilotCell(page, 'admin-app');
  await expect(linked(page, 4)).toBeVisible();

  await autopilotCell(page, 'llm-product');
  await expect(linked(page, 4)).toBeVisible();
  await expect(announcer(page)).toHaveText('Docked at LLM product.');
});

type MapMarker = { x: number; y: number; lit: boolean };

const readMarkers = async (canvas: Locator): Promise<MapMarker[]> => {
  return canvas.evaluate((node) => {
    if (!(node instanceof HTMLCanvasElement)) {
      return [];
    }

    const context = node.getContext('2d');

    if (context === null) {
      return [];
    }

    const { width, height } = node;
    const data: Uint8ClampedArray = context.getImageData(0, 0, width, height).data;

    const rgbAt = (x: number, y: number): number[] => {
      const at: number = (y * width + x) * 4;

      return [data[at] ?? 0, data[at + 1] ?? 0, data[at + 2] ?? 0];
    };

    const found: MapMarker[] = [];

    for (let y = 3; y < height - 3; y += 1) {
      for (let x = 3; x < width - 3; x += 1) {
        const core: number[] = rgbAt(x, y);

        if (
          !core.every((c) => {
            return c < 50;
          })
        ) {
          continue;
        }

        const ring: number[][] = [
          rgbAt(x - 2, y),
          rgbAt(x + 2, y),
          rgbAt(x, y - 2),
          rgbAt(x, y + 2),
        ];

        const pending: boolean = ring.every((c) => {
          return c.every((v) => {
            return v > 200;
          });
        });

        const lit: boolean = ring.every((c) => {
          return (c[0] ?? 0) > 200 && (c[1] ?? 0) > 120 && (c[1] ?? 0) < 210 && (c[2] ?? 0) < 70;
        });

        if (pending || lit) {
          found.push({ x: (x + 0.5) / width, y: (y + 0.5) / height, lit });
        }
      }
    }

    return found;
  });
};

test('autopilot.map: opens as a dialog, far click does nothing, click near a station flies and closes', async ({
  page,
}) => {
  await bootToHome(page);

  const trigger = headerButton(page, /^Road map$/);
  const map = page.locator('#road-map');
  const canvas = map.locator('canvas');

  await trigger.click();
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute('role', 'dialog');
  await expect(trigger).toHaveAttribute('aria-controls', 'road-map');
  await expect(canvas).toHaveAttribute('width', '128');
  await expect(canvas).toHaveAttribute('height', '128');
  await expect(canvas).toHaveCSS('image-rendering', 'pixelated');

  await expect
    .poll(async () => {
      return (await readMarkers(canvas)).length;
    })
    .toBeGreaterThanOrEqual(9);

  const markers: MapMarker[] = await readMarkers(canvas);
  const box = await canvas.boundingBox();

  if (box === null) {
    throw new Error('map canvas has no box');
  }

  const pickRadius: number = 14 / 128;

  let far: { x: number; y: number } | null = null;
  let best = 0;

  for (let row = 0; row <= 10; row += 1) {
    for (let col = 0; col <= 10; col += 1) {
      const point = { x: col / 10, y: row / 10 };

      const nearest: number = Math.min(
        ...markers.map((m) => {
          return Math.hypot(m.x - point.x, m.y - point.y);
        }),
      );

      if (nearest > best) {
        best = nearest;
        far = point;
      }
    }
  }

  expect(far).not.toBeNull();
  expect(best).toBeGreaterThan(pickRadius);

  await page.mouse.click(box.x + (far?.x ?? 0) * box.width, box.y + (far?.y ?? 0) * box.height);
  await expect(map).toBeVisible();
  await expect(station(page, 'home-base')).toHaveAttribute('data-docked', /.*/);

  const pending: MapMarker | undefined = markers.find((m) => {
    return !m.lit;
  });

  expect(pending).toBeDefined();

  await page.mouse.click(
    box.x + (pending?.x ?? 0) * box.width,
    box.y + (pending?.y ?? 0) * box.height,
  );

  await expect(map).toBeHidden();
  await expectUndocked(page);

  await expect(page.locator('section[data-station][data-docked]')).toHaveCount(1, {
    timeout: AUTOPILOT_DOCK_MS,
  });

  await expect(station(page, 'home-base')).not.toHaveAttribute('data-docked', /.*/);
});
