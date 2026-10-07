import { expect, test } from '@playwright/test';

import { WORLD_COPY } from '@/content/world.content';

import type { FallbacksCaseId } from '@tests/front/e2e/fallbacks.cases';
import type { Page } from '@playwright/test';

const caseTitle = (id: FallbacksCaseId, description: string): string => {
  return `${id}: ${description}`;
};

const NOTICE_WITHIN_MS = 1000;
const CHUNK_FAIL_WITHIN_MS = 8000;
const LOW_END_DEVICE_MEMORY_GB = 2;
const CHUNK_PATH = /\/_next\/static\/chunks\/[^"'?\s]+\.js/g;

const hydrated = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => {
    return 'next' in window;
  });
};

test(caseTitle('spec.fallback.server-html-boot', 'boot state in HTML'), async ({ request }) => {
  const html: string = await (await request.get('/')).text();

  expect(html).toContain('data-view="boot"');
  expect(html).toContain('data-boot="idle"');

  const loader: string = /<[a-z]+\b[^>]*\bdata-loader\b[\s\S]*?<button/.exec(html)?.[0] ?? '';

  expect(loader).toContain(WORLD_COPY.loader.name);
  expect(loader).toContain(WORLD_COPY.loader.line);
  expect(loader).not.toContain('<h2');
});

test(caseTitle('spec.fallback.no-webgl-notice', 'within 1 s'), async ({ page }, info) => {
  test.skip(info.project.name !== 'no-webgl', 'applies to the no-webgl project only');

  await page.goto('/');
  await hydrated(page);

  await expect(page.locator('[data-notice]')).toHaveText(WORLD_COPY.notices.noWebgl2, {
    timeout: NOTICE_WITHIN_MS,
  });

  await expect(page.locator('[data-view="text"]')).toBeVisible();
  await expect(page.locator('[data-loader]')).toBeHidden();
});

test(
  caseTitle('spec.fallback.chunks-aborted', 'text and notice'),
  async ({ page, request }, info) => {
    test.skip(info.project.name === 'no-webgl', 'no-webgl falls back before any chunk loads');

    const html: string = await (await request.get('/')).text();
    const initial: Set<string> = new Set(html.match(CHUNK_PATH) ?? []);

    await page.route('**/_next/static/chunks/**/*.js', async (route) => {
      const path: string = new URL(route.request().url()).pathname;

      if (initial.has(path)) {
        await route.continue();

        return;
      }

      await route.abort();
    });

    await page.goto('/');
    await hydrated(page);

    await expect(page.locator('[data-notice]')).toHaveText(WORLD_COPY.notices.failed, {
      timeout: CHUNK_FAIL_WITHIN_MS,
    });

    await expect(page.locator('[data-view="text"]')).toBeVisible();
    await expect(page.locator('[data-loader]')).toBeHidden();
    await expect(page.locator('#text')).toBeVisible();
  },
);

test(caseTitle('spec.fallback.low-end-default', 'text default, opt in'), async ({ page }, info) => {
  test.skip(info.project.name === 'no-webgl', 'no world to opt into without WebGL2');

  await page.addInitScript((memory: number) => {
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => {
        return memory;
      },
    });
  }, LOW_END_DEVICE_MEMORY_GB);

  await page.goto('/');
  await hydrated(page);

  await expect(page.locator('[data-view="text"]')).toBeVisible();
  await expect(page.locator('[data-loader]')).toBeHidden();

  await page.getByRole('button', { name: WORLD_COPY.header.toWorld }).click();

  await expect(page.locator('[data-view]')).toHaveAttribute('data-view', 'world');
  await expect(page.locator('[data-loader]')).toBeVisible();
});
