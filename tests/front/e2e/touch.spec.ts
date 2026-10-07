import { expect, test } from '@playwright/test';

import { touchDrag, touchPress, touchRelease } from '@tests/front/e2e/support/touch';
import { openWorld, station, takeOff, waitDocked, waitReady } from '@tests/front/e2e/support/world';

import type { TOUCH_CASES } from '@tests/front/e2e/touch.cases';
import type { Locator, Page, TestInfo } from '@playwright/test';

type CaseId = (typeof TOUCH_CASES)[number]['id'];

const TEST_TIMEOUT_MS = 240_000;
const MIN_TARGET_PX = 44;
const STICK_ORIGIN = { x: 195, y: 560 };
const STICK_PUSH = { x: 245, y: 560 };
const TURN_SAMPLE_MS = 600;
const MOVED_PX = 4;
const RAMP_MS = 800;
const WINDOW_MS = 1500;
const BOOST_RATIO = 1.5;
const DISTANCE_PATTERN = /(\d+)\s*m\b/;
const TOUCH_FLYING_HINT = 'Drag to steer. Fly into a beam to connect.';
const TOUCH_DOCKED_HINT = 'Docked. Tap Take off to fly on.';

const caseTitle = (id: CaseId, description: string): string => {
  return `${id}: ${description}`;
};

const silenceAudio = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const Base = window.AudioContext;

    if (Base) {
      window.AudioContext = class extends Base {
        constructor(options?: AudioContextOptions) {
          super(options);
          void this.suspend();
        }

        override resume(): Promise<void> {
          return Promise.resolve();
        }
      };
    }
  });
};

test.beforeEach(async ({ page }, info: TestInfo) => {
  await silenceAudio(page);
  test.skip(info.project.name !== 'mobile-390', 'runs in mobile-390 only');
  test.setTimeout(TEST_TIMEOUT_MS);
});

const startDocked = async (page: Page): Promise<void> => {
  await openWorld(page);
  await waitReady(page);
  await takeOff(page);
  await waitDocked(page, 'home-base');
};

const startFlying = async (page: Page): Promise<void> => {
  await startDocked(page);

  await station(page, 'home-base')
    .getByRole('button', { name: /take off/i })
    .click();

  await expect(station(page, 'home-base')).not.toHaveAttribute('data-docked', /.*/);
};

const canvasOf = (page: Page): Locator => {
  return page.locator('.world-stage canvas');
};

const labelCenters = async (page: Page): Promise<Record<string, number>> => {
  return page.evaluate(() => {
    const centers: Record<string, number> = {};

    for (const element of document.querySelectorAll<HTMLElement>(
      '[data-nav-label][data-visible="true"]',
    )) {
      const box = element.getBoundingClientRect();

      centers[element.dataset['navLabel'] ?? ''] = box.x + box.width / 2;
    }

    return centers;
  });
};

const targetDistance = async (page: Page): Promise<number> => {
  const text: string = await page.evaluate(() => {
    const label = document.querySelector('[data-nav-label][data-target][data-visible="true"]');
    const edge = document.querySelector('[data-nav-edge]:not([hidden]) .nav-edge-name');

    return (label ?? edge)?.textContent ?? '';
  });

  return Number(DISTANCE_PATTERN.exec(text)?.[1] ?? Number.NaN);
};

const rateOver = async (page: Page, windowMs: number): Promise<number> => {
  const from: number = await targetDistance(page);

  await page.waitForTimeout(windowMs);

  const to: number = await targetDistance(page);

  return (Math.abs(to - from) / windowMs) * 1000;
};

test(caseTitle('touch.stick.ring', 'ring appears on press, hides on release'), async ({ page }) => {
  await startFlying(page);

  const canvas: Locator = canvasOf(page);
  const ring: Locator = page.locator('[data-stick]');

  await expect(ring).toBeHidden();
  await touchPress(canvas, STICK_ORIGIN);
  await expect(ring).toBeVisible();
  await touchRelease(canvas, STICK_ORIGIN);
  await expect(ring).toBeHidden();
});

test(caseTitle('touch.stick.turns', 'dragging the stick moves a label'), async ({ page }) => {
  await startFlying(page);

  await expect
    .poll(async () => {
      return Object.keys(await labelCenters(page)).length;
    })
    .toBeGreaterThan(0);

  const canvas: Locator = canvasOf(page);
  const before: Record<string, number> = await labelCenters(page);

  await touchDrag(canvas, STICK_ORIGIN, STICK_PUSH);
  await page.waitForTimeout(TURN_SAMPLE_MS);

  const after: Record<string, number> = await labelCenters(page);

  await touchRelease(canvas, STICK_PUSH);

  const shifts: number[] = Object.keys(before)
    .filter((id) => {
      return id in after;
    })
    .map((id) => {
      return Math.abs((after[id] ?? 0) - (before[id] ?? 0));
    });

  expect(Math.max(0, ...shifts)).toBeGreaterThan(MOVED_PX);
});

test(caseTitle('touch.boost.visible', 'Boost is displayed while flying'), async ({ page }) => {
  await startDocked(page);
  await expect(page.locator('[data-boost]')).toHaveCount(0);

  await station(page, 'home-base')
    .getByRole('button', { name: /take off/i })
    .click();

  await expect(page.locator('[data-boost]')).toBeVisible();
});

test(caseTitle('touch.boost.speed', 'Boost shrinks the distance faster'), async ({ page }) => {
  await startFlying(page);

  await expect
    .poll(async () => {
      return targetDistance(page);
    })
    .not.toBeNaN();

  const boost: Locator = page.locator('[data-boost]');
  const box = await boost.boundingBox({ timeout: 3000 });

  expect(box).not.toBeNull();

  const point = { x: (box?.width ?? 0) / 2, y: (box?.height ?? 0) / 2 };

  const cruise: number = await rateOver(page, WINDOW_MS);

  await touchPress(boost, point);
  await page.waitForTimeout(RAMP_MS);

  const boosted: number = await rateOver(page, WINDOW_MS);

  await touchRelease(boost, point);

  expect(cruise).toBeGreaterThan(0);
  expect(boosted).toBeGreaterThanOrEqual(cruise * BOOST_RATIO);
});

test(caseTitle('touch.hint.flying', 'flying hint reads the touch copy'), async ({ page }) => {
  await startFlying(page);

  await expect(page.locator('[data-hint]')).toHaveText(TOUCH_FLYING_HINT);
});

test(caseTitle('touch.hint.docked', 'docked hint reads the touch copy'), async ({ page }) => {
  await startDocked(page);

  await expect(page.locator('[data-hint]')).toHaveText(TOUCH_DOCKED_HINT);
});

test(caseTitle('touch.takeoff.target', 'Take off is 44 px and leaves'), async ({ page }) => {
  await startDocked(page);

  const button: Locator = station(page, 'home-base').getByRole('button', { name: /take off/i });
  const box = await button.boundingBox();

  expect(box?.width ?? 0).toBeGreaterThanOrEqual(MIN_TARGET_PX);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TARGET_PX);

  await button.click();

  await expect(station(page, 'home-base')).not.toHaveAttribute('data-docked', /.*/);
});
