import { expect, test } from '@playwright/test';

import {
  WIDE_BREAKPOINT_PX,
  openWorld,
  station,
  takeOff,
  waitDocked,
  waitReady,
} from '@tests/front/e2e/support/world';

import type { LAYOUT_CASES } from '@tests/front/e2e/layout.cases';
import type { Locator, Page, TestInfo } from '@playwright/test';

type CaseId = (typeof LAYOUT_CASES)[number]['id'];

const TEST_TIMEOUT_MS = 240_000;
const SHEET_MAX_RATIO = 0.5;
const SR_ONLY_MAX_PX = 1;
const SUBPIXEL_PX = 0.5;
const DESKTOP_HEIGHT = 900;
const DESKTOP_WIDTH = 1440;
const GSAP_MARKERS: readonly string[] = ['gsap.registerPlugin', 'GreenSock', 'ScrollTrigger'];
const HUD_MARKERS: readonly string[] = ['data-title-card', 'data-boost'];

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

test.beforeEach(async ({ page }) => {
  await silenceAudio(page);
});

const onlyProject = (info: TestInfo, name: string): void => {
  test.skip(info.project.name !== name, `runs in ${name} only`);
  test.setTimeout(TEST_TIMEOUT_MS);
};

const startDocked = async (page: Page): Promise<void> => {
  await openWorld(page);
  await waitReady(page);
  await takeOff(page);
  await waitDocked(page, 'home-base');
};

const barOf = (page: Page): Locator => {
  return page.locator('[data-hint]').locator('xpath=..');
};

const overflowOf = async (page: Page): Promise<number> => {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
};

test(
  caseTitle('layout.mobile.no-overflow', 'no horizontal scroll at 390'),
  async ({ page }, info) => {
    onlyProject(info, 'mobile-390');
    await openWorld(page);

    expect(await overflowOf(page)).toBeLessThanOrEqual(0);

    await waitReady(page);
    await takeOff(page);
    await waitDocked(page, 'home-base');

    expect(await overflowOf(page)).toBeLessThanOrEqual(0);

    const viewportWidth: number = page.viewportSize()?.width ?? 0;

    const rights: number[] = await page.locator('section[data-station]').evaluateAll((panels) => {
      return panels.map((panel) => {
        return panel.getBoundingClientRect().right;
      });
    });

    for (const right of rights) {
      expect(right).toBeLessThanOrEqual(viewportWidth);
    }
  },
);

test(
  caseTitle('layout.mobile.sheet', 'sheet is at most half and clear of the bar'),
  async ({ page }, info) => {
    onlyProject(info, 'mobile-390');
    await startDocked(page);

    const viewportHeight: number = page.viewportSize()?.height ?? 0;
    const panel = await station(page, 'home-base').boundingBox();
    const bar = await barOf(page).boundingBox();

    expect(panel).not.toBeNull();
    expect(bar).not.toBeNull();

    expect(panel?.height ?? Infinity).toBeLessThanOrEqual(
      viewportHeight * SHEET_MAX_RATIO + SUBPIXEL_PX,
    );

    expect((panel?.y ?? 0) + (panel?.height ?? 0)).toBeLessThanOrEqual(bar?.y ?? 0);
  },
);

test(caseTitle('layout.mobile.boost-clear', 'Boost sits above the bar'), async ({ page }, info) => {
  onlyProject(info, 'mobile-390');
  await startDocked(page);

  await station(page, 'home-base')
    .getByRole('button', { name: /take off/i })
    .click();

  const boost = await page.locator('[data-boost]').boundingBox({ timeout: 3000 });
  const bar = await barOf(page).boundingBox();

  expect(boost).not.toBeNull();
  expect(bar).not.toBeNull();
  expect((boost?.y ?? 0) + (boost?.height ?? 0)).toBeLessThanOrEqual(bar?.y ?? 0);
});

test(
  caseTitle('layout.header.labels-sr-only', 'labels hide below 861 px'),
  async ({ page }, info) => {
    onlyProject(info, 'desktop-1440');
    await startDocked(page);

    const labels: Locator = page.locator('header button > span:not([aria-hidden])');

    expect(await labels.count()).toBeGreaterThan(0);

    const widthOfFirst = async (width: number): Promise<number> => {
      await page.setViewportSize({ width, height: DESKTOP_HEIGHT });

      return (await labels.first().boundingBox())?.width ?? 0;
    };

    await expect
      .poll(() => {
        return widthOfFirst(DESKTOP_WIDTH);
      })
      .toBeGreaterThan(SR_ONLY_MAX_PX);

    await expect
      .poll(() => {
        return widthOfFirst(WIDE_BREAKPOINT_PX - 1);
      })
      .toBeLessThanOrEqual(SR_ONLY_MAX_PX);
  },
);

test(
  caseTitle('layout.chunks.lazy-hud', 'no GSAP or HUD in first load'),
  async ({ page }, info) => {
    onlyProject(info, 'desktop-1440');

    const firstLoad: { url: string; body: string }[] = [];
    const later: string[] = [];
    const pending: Promise<void>[] = [];
    let phase: 'first' | 'later' = 'first';

    page.on('response', (response) => {
      if (!response.url().endsWith('.js')) {
        return;
      }

      const current = phase;
      const url: string = response.url();

      pending.push(
        response.text().then(
          (body) => {
            if (current === 'first') {
              firstLoad.push({ url, body });
            } else {
              later.push(body);
            }
          },
          () => {
            return undefined;
          },
        ),
      );
    });

    await openWorld(page);
    await page.waitForLoadState('load');
    await Promise.all(pending);
    phase = 'later';

    expect(firstLoad.length).toBeGreaterThan(0);

    for (const marker of [...GSAP_MARKERS, ...HUD_MARKERS]) {
      const hit: string[] = firstLoad
        .filter((entry) => {
          return entry.body.includes(marker);
        })
        .map((entry) => {
          return entry.url;
        });

      expect(hit, `first load contains ${marker}`).toEqual([]);
    }

    await waitReady(page);
    await takeOff(page);
    await waitDocked(page, 'home-base');
    await Promise.all(pending);

    for (const marker of HUD_MARKERS) {
      expect(
        later.some((body) => {
          return body.includes(marker);
        }),
        `HUD marker ${marker} requested after load`,
      ).toBe(true);
    }
  },
);
