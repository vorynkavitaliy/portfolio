import { expect, test } from '@playwright/test';

import { SITE_COPY } from '@/content/site.content';

import type { SeoCaseId } from '@tests/front/e2e/seo.cases';

const caseTitle = (id: SeoCaseId, description: string): string => {
  return `${id}: ${description}`;
};

const PNG_WIDTH_OFFSET = 16;
const PNG_HEIGHT_OFFSET = 20;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

test(caseTitle('spec.seo.title-description', 'match the site copy'), async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(SITE_COPY.title);

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    SITE_COPY.description,
  );
});

test(caseTitle('spec.seo.canonical', 'is the root URL'), async ({ page, baseURL }) => {
  await page.goto('/');

  const href: string = (await page.locator('link[rel="canonical"]').getAttribute('href')) ?? '';

  expect(new URL(href).href).toBe(`${baseURL}/`);
});

test(caseTitle('spec.seo.og-image', '200 PNG 1200x630'), async ({ page, request }) => {
  await page.goto('/');

  const href: string =
    (await page.locator('meta[property="og:image"]').getAttribute('content')) ?? '';

  expect(href).not.toBe('');

  const response = await request.get(href);

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('image/png');

  const bytes: Buffer = await response.body();

  expect(bytes.readUInt32BE(PNG_WIDTH_OFFSET)).toBe(OG_WIDTH);
  expect(bytes.readUInt32BE(PNG_HEIGHT_OFFSET)).toBe(OG_HEIGHT);
});

test(caseTitle('spec.seo.json-ld-person', 'Person block'), async ({ page }) => {
  await page.goto('/');

  const raw: string =
    (await page.locator('script[type="application/ld+json"]').first().textContent()) ?? '';

  const data: unknown = JSON.parse(raw);

  expect(data).toMatchObject({ '@type': 'Person', name: SITE_COPY.person.name });
});

test(caseTitle('spec.seo.sitemap-robots', 'sitemap and robots'), async ({ request, baseURL }) => {
  const sitemap = await request.get('/sitemap.xml');

  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain(`<loc>${baseURL}/</loc>`);

  const robots = await request.get('/robots.txt');
  const text: string = await robots.text();

  expect(robots.status()).toBe(200);
  expect(text).toContain('Allow: /');
  expect(text).toContain(`Sitemap: ${baseURL}/sitemap.xml`);
});
