import { expect } from '@playwright/test';

import type { Locator, Page } from '@playwright/test';

export const WIDE_BREAKPOINT_PX = 860;
export const READY_TIMEOUT_MS = 120_000;
export const FLY_TIMEOUT_MS = 120_000;
export const SERVO_TOLERANCE = 0.04;
const WIDE_AIM = 0.67;
const NARROW_AIM = 0.5;
const SERVO_STEP_MS = 120;

export const openWorld = async (page: Page): Promise<void> => {
  await page.goto('/');
};

const loader = (page: Page): Locator => {
  return page.locator('[data-loader]');
};

export const takeOffButton = (page: Page): Locator => {
  return loader(page).getByRole('button', { name: /take off/i });
};

export const waitReady = async (page: Page): Promise<void> => {
  await expect(takeOffButton(page)).toBeEnabled({ timeout: READY_TIMEOUT_MS });
};

export const takeOff = async (page: Page): Promise<void> => {
  await takeOffButton(page).click();
};

export const station = (page: Page, id: string): Locator => {
  return page.locator(`section[data-station="${id}"]`);
};

export const waitDocked = async (page: Page, id: string, timeout?: number): Promise<void> => {
  await expect(station(page, id)).toHaveAttribute('data-docked', /.*/, {
    timeout: timeout ?? FLY_TIMEOUT_MS,
  });
};

export const counter = (page: Page): Locator => {
  return page.getByText(/Linked \d+\/\d+/);
};

const pause = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const aimRatio = (width: number): number => {
  return width > WIDE_BREAKPOINT_PX ? WIDE_AIM : NARROW_AIM;
};

export const flyTo = async (page: Page, id: string): Promise<void> => {
  const label: Locator = page.locator(`[data-nav-label="${id}"]`);
  const docked: Locator = station(page, id);
  const deadline: number = Date.now() + FLY_TIMEOUT_MS;
  let held: string | null = null;

  const hold = async (key: string | null): Promise<void> => {
    if (held === key) {
      return;
    }

    if (held !== null) {
      await page.keyboard.up(held);
    }

    if (key !== null) {
      await page.keyboard.down(key);
    }

    held = key;
  };

  try {
    while (Date.now() < deadline) {
      if ((await docked.getAttribute('data-docked')) !== null) {
        return;
      }

      const viewport = page.viewportSize();
      const width: number = viewport?.width ?? 0;
      const visible: boolean = (await label.getAttribute('data-visible')) === 'true';
      const box = visible ? await label.boundingBox() : null;

      if (box === null) {
        await hold('d');
      } else {
        const x: number = box.x + box.width / 2;
        const aim: number = aimRatio(width) * width;
        const tolerance: number = SERVO_TOLERANCE * width;

        if (x < aim - tolerance) {
          await hold('a');
        } else if (x > aim + tolerance) {
          await hold('d');
        } else {
          await hold(null);
        }
      }

      await pause(page, SERVO_STEP_MS);
    }
  } finally {
    await hold(null);
  }

  throw new Error(`flyTo(${id}) did not dock within ${FLY_TIMEOUT_MS} ms`);
};
