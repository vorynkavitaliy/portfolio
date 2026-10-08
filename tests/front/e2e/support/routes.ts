import { expect } from '@playwright/test';

import { openWorld, station, takeOff, waitDocked, waitReady } from '@tests/front/e2e/support/world';

import type { Locator, Page, TestInfo } from '@playwright/test';

export const WORLD_PROJECT = 'desktop-1440';
export const HOME_DOCK_MS = 3_000;
export const AUTOPILOT_DOCK_MS = 90_000;
export const DOCK_SETTLE_MS = 1_500;
export const AWAY_MS = 2_500;
export const SKIP_REASON = 'world flight specs run in desktop-1440 only';

export const STATION_LABELS = {
  'home-base': 'Home base',
  'full-cycle': 'Full cycle',
  frontend: 'Frontend',
  backend: 'Backend',
  ai: 'AI',
  systems: 'Systems',
  deploy: 'Deploy',
  'this-world': 'This world',
  contact: 'Contact',
} as const;

export type StationKey = keyof typeof STATION_LABELS;

export const STATION_KEYS = Object.keys(STATION_LABELS) as StationKey[];

export const skipOutsideWorldProject = (testInfo: TestInfo): void => {
  testInfo.skip(testInfo.project.name !== WORLD_PROJECT, SKIP_REASON);
};

export const bootToHome = async (page: Page): Promise<number> => {
  await openWorld(page);
  await waitReady(page);

  const startedAt: number = Date.now();

  await takeOff(page);
  await waitDocked(page, 'home-base', HOME_DOCK_MS + 2_000);

  return Date.now() - startedAt;
};

export const dockedPanel = (page: Page): Locator => {
  return page.locator('section[data-station][data-docked]');
};

export const barCell = (page: Page, id: StationKey): Locator => {
  return page.locator(`[data-station-cell="${id}"]`);
};

export const headerButton = (page: Page, name: RegExp): Locator => {
  return page.getByRole('button', { name });
};

export const announcer = (page: Page): Locator => {
  return page.locator('[data-dock-announcer]');
};

export const autopilotCell = async (page: Page, id: StationKey): Promise<void> => {
  await barCell(page, id).click();

  await expect(station(page, id)).toHaveAttribute('data-docked', /.*/, {
    timeout: AUTOPILOT_DOCK_MS,
  });

  await page.waitForTimeout(DOCK_SETTLE_MS);
};

export const expectUndocked = async (page: Page): Promise<void> => {
  await expect(dockedPanel(page)).toHaveCount(0);
};

export const linked = (page: Page, n: number): Locator => {
  return page.getByText(`Linked ${n}/9`);
};

export const flyAway = async (page: Page): Promise<void> => {
  await page.keyboard.down('w');
  await page.waitForTimeout(AWAY_MS);
  await page.keyboard.up('w');
};
