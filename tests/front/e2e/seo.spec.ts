import { expect, test } from '@playwright/test';
import { z } from 'zod';

import type { SeoCaseId } from '@tests/front/e2e/seo.cases';

const caseTitle = (id: SeoCaseId, description: string): string => {
  return `${id}: ${description}`;
};

const PNG_WIDTH_OFFSET = 16;
const PNG_HEIGHT_OFFSET = 20;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const TITLE = 'Vitalii Vorynka · Full-stack Developer · Vue, React, Node.js, NestJS';
const OG_TITLE = 'Vitalii Vorynka · Full-stack Developer, AI Engineer';

const DESCRIPTION =
  'Full-stack developer, 7+ years in production. React, Next.js, Vue, Node.js, NestJS, Docker, CI/CD, LLMs and AI agents. A 3D world portfolio with a text version.';

const OG_ALT = 'Vitalii Vorynka, full-stack developer, above a night voxel world';

const KEYWORDS: readonly string[] = [
  'Vitalii Vorynka',
  'full-stack developer',
  'AI engineer',
  'React developer',
  'Next.js developer',
  'Vue developer',
  'Nuxt developer',
  'Node.js developer',
  'NestJS developer',
  'TypeScript',
  'LLM integration',
  'RAG',
  'AI agents',
  'Claude Code',
  'MCP',
  'Docker',
  'CI/CD',
  'Kyiv',
  'Ukraine',
  'remote',
];

const KNOWS_ABOUT: readonly string[] = [
  'TypeScript',
  'React',
  'Next.js',
  'Vue',
  'Nuxt',
  'Node.js',
  'NestJS',
  'Express',
  'PostgreSQL',
  'Redis',
  'RabbitMQ',
  'Docker',
  'CI/CD',
  'LLM integration',
  'RAG',
  'AI agents',
  'MCP',
];

const STATION_TITLES: readonly string[] = [
  'From idea to production',
  'Interfaces in React and Vue',
  'Services on Node.js',
  'AI in the product and the workflow',
  'Ships to production',
  'The working stack',
  'This site is a project too',
  'Open a channel',
];

const manifestIconsSchema = z.object({
  icons: z.array(z.object({ src: z.string(), sizes: z.string() })),
});

const LINKEDIN = 'https://www.linkedin.com/in/vitaliy-vorynka-7b6005142';

test(caseTitle('spec.seo.title-description', 'match the copy v2 values'), async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(TITLE);

  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', DESCRIPTION);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', OG_TITLE);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', OG_TITLE);

  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    'content',
    'Vitalii Vorynka',
  );

  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', OG_ALT);
});

test(caseTitle('spec.seo.keywords', 'twenty owner keywords'), async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('meta[name="keywords"]')).toHaveAttribute(
    'content',
    KEYWORDS.join(','),
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

test(caseTitle('spec.seo.json-ld-profile', 'ProfilePage graph'), async ({ page, baseURL }) => {
  await page.goto('/');

  const blocks = page.locator('script[type="application/ld+json"]');

  await expect(blocks).toHaveCount(1);

  const raw: string = (await blocks.first().textContent()) ?? '';
  const data: unknown = JSON.parse(raw);

  expect(data).toEqual({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${baseURL}/`,
    inLanguage: 'en',
    mainEntity: {
      '@type': 'Person',
      name: 'Vitalii Vorynka',
      jobTitle: 'Full-stack Developer, AI Engineer',
      description: DESCRIPTION,
      url: `${baseURL}/`,
      image: `${baseURL}/opengraph-image`,
      sameAs: [LINKEDIN],
      knowsAbout: KNOWS_ABOUT,
      address: { '@type': 'PostalAddress', addressLocality: 'Kyiv', addressCountry: 'UA' },
    },
  });

  expect(raw).not.toContain('@gmail');
  expect(raw).not.toContain('mailto');
});

const pngSize = (bytes: Buffer): readonly [number, number] => {
  return [bytes.readUInt32BE(PNG_WIDTH_OFFSET), bytes.readUInt32BE(PNG_HEIGHT_OFFSET)];
};

test(
  caseTitle('spec.seo.icons', 'svg, apple 180, png 192 and 512, manifest'),
  async ({ page, request }) => {
    await page.goto('/');

    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveCount(1);

    const apple = page.locator('link[rel="apple-touch-icon"]');

    await expect(apple).toHaveAttribute('sizes', '180x180');

    const appleHref: string = (await apple.getAttribute('href')) ?? '';
    const appleResponse = await request.get(appleHref);

    expect(appleResponse.status()).toBe(200);
    expect(appleResponse.headers()['content-type']).toBe('image/png');
    expect(pngSize(await appleResponse.body())).toEqual([180, 180]);

    const manifestResponse = await request.get('/manifest.webmanifest');

    expect(manifestResponse.status()).toBe(200);

    const manifestJson: unknown = await manifestResponse.json();

    expect(manifestJson).toMatchObject({
      name: 'Vitalii Vorynka',
      short_name: 'Vitalii Vorynka',
      display: 'standalone',
      theme_color: '#070a12',
      background_color: '#070a12',
      icons: [
        { sizes: '192x192', type: 'image/png' },
        { sizes: '512x512', type: 'image/png' },
      ],
    });

    const manifest = manifestIconsSchema.parse(manifestJson);

    for (const icon of manifest.icons) {
      const response = await request.get(icon.src);
      const side: number = Number.parseInt(icon.sizes, 10);

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe('image/png');
      expect(pngSize(await response.body())).toEqual([side, side]);
    }
  },
);

test(
  caseTitle('spec.seo.proxy-routes', 'CSP on pages, none on exact static routes'),
  async ({ request }) => {
    const home = await request.get('/');

    expect(home.headers()['content-security-policy']).toContain("default-src 'self'");

    const lookalike = await request.get('/apple-iconX');

    expect(lookalike.status()).toBe(404);
    expect(lookalike.headers()['content-security-policy']).toContain("default-src 'self'");
  },
);

test(caseTitle('spec.seo.headings', 'one h1 and eight h2'), async ({ request }) => {
  const html: string = await (await request.get('/')).text();

  const tags = (name: string): readonly string[] => {
    return [...html.matchAll(new RegExp(`<${name}[ >][^]*?</${name}>`, 'g'))].map((match) => {
      return match[0].replace(/<[^>]+>/g, '');
    });
  };

  expect(tags('h1')).toEqual(['Vitalii Vorynka']);
  expect(tags('h2')).toEqual(STATION_TITLES);
});

test(
  caseTitle('spec.seo.non-production-noindex', 'localhost is not indexable'),
  async ({ request, baseURL }) => {
    const page = await request.get('/');

    expect(page.headers()['x-robots-tag']).toBe('noindex, nofollow');

    const robots = await request.get('/robots.txt');
    const text: string = await robots.text();

    expect(robots.status()).toBe(200);
    expect(text).toContain('Disallow: /');
    expect(text).not.toContain('Allow: /\n');
    expect(text).not.toContain('Sitemap:');
    expect(baseURL).toContain('localhost');
  },
);

test(caseTitle('spec.seo.sitemap', 'root with lastmod'), async ({ request, baseURL }) => {
  const sitemap = await request.get('/sitemap.xml');
  const text: string = await sitemap.text();

  expect(sitemap.status()).toBe(200);
  expect(text).toContain(`<loc>${baseURL}/</loc>`);
  expect(text).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T[^<]+<\/lastmod>/);
});
