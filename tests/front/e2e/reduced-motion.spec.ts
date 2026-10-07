import { expect, test } from '@playwright/test';

import { openWorld, station, takeOff, waitDocked, waitReady } from '@tests/front/e2e/support/world';

import type { REDUCED_MOTION_CASES } from '@tests/front/e2e/reduced-motion.cases';
import type { Page, TestInfo } from '@playwright/test';

type CaseId = (typeof REDUCED_MOTION_CASES)[number]['id'];

const TEST_TIMEOUT_MS = 240_000;
const DOCK_BUDGET_MS = 500;
const SAMPLE_GAP_MS = 120;
const FLY_SAMPLE_MS = 600;
const MOVED_PX = 4;

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
  test.skip(info.project.name !== 'reduced-motion', 'runs in reduced-motion only');
  test.setTimeout(TEST_TIMEOUT_MS);
});

const startDocked = async (page: Page): Promise<void> => {
  await openWorld(page);
  await waitReady(page);
  await takeOff(page);
  await waitDocked(page, 'home-base', 15_000);
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

const panelSample = async (page: Page): Promise<string> => {
  return station(page, 'home-base').evaluate((element: Element) => {
    const style = getComputedStyle(element);

    return `${style.transform}|${style.opacity}`;
  });
};

test(
  caseTitle('motion.reduced.docked-fast', 'docked at Home within 500 ms of Take off'),
  async ({ page }) => {
    await openWorld(page);
    await waitReady(page);
    await takeOff(page);
    await waitDocked(page, 'home-base', DOCK_BUDGET_MS);
  },
);

test(
  caseTitle('motion.reduced.panel-instant', 'panel and nav layer have no transition'),
  async ({ page }) => {
    await startDocked(page);

    const panel = station(page, 'home-base');

    await expect(panel).toBeVisible();

    const panelStyle = await panel.evaluate((element: Element) => {
      const style = getComputedStyle(element);

      return { duration: style.transitionDuration, opacity: style.opacity };
    });

    expect(panelStyle.duration).toBe('0s');
    expect(panelStyle.opacity).toBe('1');

    const nav = page.locator('.nav-layer');

    await expect(nav).toHaveAttribute('data-on', 'true');

    expect(
      await nav.evaluate((element: Element) => {
        return getComputedStyle(element).transitionDuration;
      }),
    ).toBe('0s');
  },
);

test(
  caseTitle('motion.reduced.panel-still', 'panel transform and opacity are stable'),
  async ({ page }) => {
    await startDocked(page);

    const first: string = await panelSample(page);

    await page.waitForTimeout(SAMPLE_GAP_MS);

    const second: string = await panelSample(page);

    expect(second).toBe(first);
    expect(first.endsWith('|1')).toBe(true);
  },
);

test(
  caseTitle('motion.reduced.no-title-card', 'title card stays hidden after docking'),
  async ({ page }) => {
    await startDocked(page);
    await page.waitForTimeout(SAMPLE_GAP_MS);

    await expect(page.locator('[data-title-card]')).toBeHidden();
  },
);

test(
  caseTitle('motion.reduced.no-flash', 'flash has opacity 0 and no inline transition'),
  async ({ page }) => {
    await startDocked(page);

    await station(page, 'home-base')
      .getByRole('button', { name: /take off/i })
      .click();

    const flash = page.locator('[data-flash]');

    await page.waitForTimeout(SAMPLE_GAP_MS);

    expect(
      await flash.evaluate((element: HTMLElement) => {
        return { opacity: getComputedStyle(element).opacity, inline: element.style.transition };
      }),
    ).toEqual({ opacity: '0', inline: '' });
  },
);

test(caseTitle('motion.reduced.no-magnet', 'hover applies no transform'), async ({ page }) => {
  await startDocked(page);

  const magnet = page.locator('header [data-magnet]').first();
  const box = await magnet.boundingBox();

  expect(box).not.toBeNull();

  if (box === null) {
    return;
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2, { steps: 5 });
  await page.waitForTimeout(400);

  expect(
    await magnet.evaluate((element: HTMLElement) => {
      return { inline: element.style.transform, computed: getComputedStyle(element).transform };
    }),
  ).toEqual({ inline: '', computed: 'none' });
});

test(caseTitle('motion.reduced.still-flies', 'holding D moves a label'), async ({ page }) => {
  await startDocked(page);

  await station(page, 'home-base')
    .getByRole('button', { name: /take off/i })
    .click();

  await expect
    .poll(async () => {
      return Object.keys(await labelCenters(page)).length;
    })
    .toBeGreaterThan(0);

  const before: Record<string, number> = await labelCenters(page);

  await page.keyboard.down('d');
  await page.waitForTimeout(FLY_SAMPLE_MS);

  const after: Record<string, number> = await labelCenters(page);

  await page.keyboard.up('d');

  const shifts: number[] = Object.keys(before)
    .filter((id) => {
      return id in after;
    })
    .map((id) => {
      return Math.abs((after[id] ?? 0) - (before[id] ?? 0));
    });

  expect(Math.max(0, ...shifts)).toBeGreaterThan(MOVED_PX);
});
