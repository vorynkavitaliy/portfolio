import { expect, test } from '@playwright/test';

import { CONTACT_FORM_COPY } from '@/content/contact-form.content';
import { WORLD_COPY } from '@/content/world.content';
import { CLIENT_IP_HEADER } from '@tests/front/e2e/support/e2e-env';
import { collectAnalytics, readAnalytics } from '@tests/front/e2e/support/analytics';
import { takeOff, waitDocked, waitReady } from '@tests/front/e2e/support/world';

import type { AnalyticsCaseId } from '@tests/front/e2e/analytics.cases';
import type { CollectedEvent } from '@tests/front/e2e/support/analytics';
import type { Page } from '@playwright/test';

const caseTitle = (id: AnalyticsCaseId, description: string): string => {
  return `${id}: ${description}`;
};

const SETTLE_MS = 600;
const FILL_DELAY_MS = 3500;
const WORLD_TIMEOUT_MS = 240_000;
const LOW_END_DEVICE_MEMORY_GB = 2;
const NON_NETWORK_PROTOCOLS: readonly string[] = ['data:', 'blob:', 'about:'];

const hydrated = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => {
    return 'next' in window;
  });
};

const named = (events: readonly CollectedEvent[], name: string): CollectedEvent[] => {
  return events.filter((event) => {
    return event.name === name;
  });
};

const textOpenedSources = (events: readonly CollectedEvent[]): unknown[] => {
  return named(events, 'text_version_opened').map((event) => {
    return event['source'];
  });
};

const trackForeignRequests = (page: Page, baseURL: string): string[] => {
  const foreign: string[] = [];
  const own: string = new URL(baseURL).origin;

  page.on('request', (request) => {
    const url = new URL(request.url());

    if (NON_NETWORK_PROTOCOLS.includes(url.protocol) || url.origin === own) {
      return;
    }

    foreign.push(url.origin);
  });

  return foreign;
};

test(
  caseTitle('spec.analytics.text-version-sources', 'once per trigger'),
  async ({ browser, baseURL }, info) => {
    test.skip(info.project.name === 'no-webgl', 'fallback source covered in no-webgl below');

    const open = async (setup: (page: Page) => Promise<void>, path: string) => {
      const context = await browser.newContext({ baseURL: baseURL ?? '' });
      const page = await context.newPage();

      await collectAnalytics(page);
      await setup(page);
      await page.goto(path);
      await hydrated(page);

      return { context, page };
    };

    const deep = await open(async () => {}, '/#text');
    await deep.page.waitForTimeout(SETTLE_MS);
    expect(textOpenedSources(await readAnalytics(deep.page))).toEqual(['deep-link']);
    await deep.context.close();

    const low = await open(async (page) => {
      await page.addInitScript((memory: number) => {
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => {
            return memory;
          },
        });
      }, LOW_END_DEVICE_MEMORY_GB);
    }, '/');

    await low.page.waitForTimeout(SETTLE_MS);
    expect(textOpenedSources(await readAnalytics(low.page))).toEqual(['low-end']);
    await low.context.close();

    const loader = await open(async () => {}, '/');
    await loader.page.getByRole('link', { name: WORLD_COPY.loader.textLink }).click();
    await loader.page.waitForTimeout(SETTLE_MS);
    expect(textOpenedSources(await readAnalytics(loader.page))).toEqual(['loader']);
    await loader.context.close();
  },
);

test(caseTitle('spec.analytics.fallback-source', 'once'), async ({ page }, info) => {
  test.skip(info.project.name !== 'no-webgl', 'applies to the no-webgl project only');

  await collectAnalytics(page);
  await page.goto('/');
  await hydrated(page);
  await page.waitForTimeout(SETTLE_MS);

  expect(textOpenedSources(await readAnalytics(page))).toEqual(['fallback']);
});

test.describe('actions', () => {
  test.use({ extraHTTPHeaders: { [CLIENT_IP_HEADER]: '203.0.113.77' } });

  test(caseTitle('spec.analytics.link-copy-send', 'once each'), async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'one send per run, desktop only');

    await collectAnalytics(page);
    await page.goto('/#text');
    await hydrated(page);

    await page.evaluate(() => {
      document.addEventListener(
        'click',
        (event) => {
          if (event.target instanceof Element && event.target.closest('a[target="_blank"]')) {
            event.preventDefault();
          }
        },
        true,
      );
    });

    await page.locator('#contact a[href*="linkedin.com"]').first().click();
    await page.locator('[data-copy-email]').click();

    await page.waitForTimeout(FILL_DELAY_MS);

    await page.getByLabel(CONTACT_FORM_COPY.labels.name).fill('E2E Analytics');
    await page.getByLabel(CONTACT_FORM_COPY.labels.email).fill('e2e-analytics@portfolio.test');
    await page.getByLabel(CONTACT_FORM_COPY.labels.message).fill('Analytics event check message.');
    await page.getByRole('button', { name: CONTACT_FORM_COPY.submit }).click();

    await expect(page.locator('#status')).toHaveText(CONTACT_FORM_COPY.status.sent);
    await page.waitForTimeout(SETTLE_MS);

    const events = await readAnalytics(page);

    expect(named(events, 'linkedin_click')).toHaveLength(1);
    expect(named(events, 'email_copy')).toHaveLength(1);
    expect(named(events, 'contact_sent')).toHaveLength(1);
  });
});

test(caseTitle('spec.analytics.world-funnel', 'once each'), async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-1440', 'full world boot, desktop only');
  test.setTimeout(WORLD_TIMEOUT_MS);

  await collectAnalytics(page);
  await page.goto('/');
  await waitReady(page);
  await takeOff(page);
  await waitDocked(page, 'home-base');
  await page.getByRole('button', { name: WORLD_COPY.header.toText }).click();
  await page.waitForTimeout(SETTLE_MS);

  const events = await readAnalytics(page);

  expect(named(events, 'take_off')).toHaveLength(1);

  const docked = named(events, 'station_docked');

  expect(docked).toHaveLength(1);
  expect(docked[0]?.['station']).toBe('home-base');
  expect(textOpenedSources(events)).toEqual(['toggle']);
});

test(
  caseTitle('spec.analytics.no-third-party-load', 'own origin only'),
  async ({ page, baseURL }) => {
    const foreign: string[] = trackForeignRequests(page, baseURL ?? '');

    await page.goto('/');
    await hydrated(page);
    await page.waitForTimeout(FILL_DELAY_MS);

    expect(foreign).toEqual([]);
  },
);

test(
  caseTitle('spec.analytics.no-third-party-world', 'own origin only'),
  async ({ page, baseURL }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'full world boot, desktop only');
    test.setTimeout(WORLD_TIMEOUT_MS);

    const foreign: string[] = trackForeignRequests(page, baseURL ?? '');

    await page.goto('/');
    await waitReady(page);
    await takeOff(page);
    await waitDocked(page, 'home-base');

    expect(foreign).toEqual([]);
  },
);
