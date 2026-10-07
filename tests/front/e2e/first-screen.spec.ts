import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { expectKnownBug } from '@tests/front/e2e/support/known-bug';

import type { FirstScreenCaseId } from '@tests/front/e2e/first-screen.cases';

const caseTitle = (id: FirstScreenCaseId, description: string): string => {
  return `${id}: ${description}`;
};

test(caseTitle('spec.first-screen.status', 'answers 200'), async ({ request }) => {
  const response = await request.get('/');

  expect(response.status()).toBe(200);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test(
    caseTitle('spec.first-screen.h1-without-js', 'h1 is in the server HTML'),
    async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('heading', { level: 1, name: 'Vitalii Vorynka' })).toBeVisible();
    },
  );
});

test(caseTitle('sec.headers.present', 'security headers are set'), async ({ request }) => {
  const headers = (await request.get('/')).headers();

  expect(headers['strict-transport-security']).toBe('max-age=63072000; includeSubDomains');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

  expect(headers['permissions-policy']).toBe(
    'camera=(), microphone=(), geolocation=(), payment=()',
  );

  const policy: string[] = (headers['content-security-policy'] ?? '').split('; ');

  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toContain("form-action 'self'");
  expect(policy).toContain("base-uri 'self'");
});

test(
  caseTitle('sec.headers.csp-default-script', 'default-src and script-src are set'),
  async ({ request }) => {
    const policy: string[] = (
      (await request.get('/')).headers()['content-security-policy'] ?? ''
    ).split('; ');

    await expectKnownBug('csp.default-src-script-src', async () => {
      expect(policy).toContain("default-src 'self'");

      expect(
        policy.some((directive: string) => {
          return directive.startsWith("script-src 'self'");
        }),
      ).toBe(true);
    });
  },
);

test(caseTitle('sec.headers.no-powered-by', 'X-Powered-By is absent'), async ({ request }) => {
  const headers = (await request.get('/')).headers();

  expect(headers['x-powered-by']).toBeUndefined();
});

test(caseTitle('wcag.axe.no-violations', 'axe finds nothing on /'), async ({ page }) => {
  await page.goto('/');

  const result = await new AxeBuilder({ page }).analyze();

  expect(result.violations).toEqual([]);
});

test(
  caseTitle('state.no-webgl.forced', 'no WebGL context can be created'),
  async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'no-webgl', 'applies to the no-webgl project only');

    await page.goto('/');

    const context = await page.evaluate(() => {
      const canvas = document.createElement('canvas');

      return canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    });

    expect(context).toBeNull();
  },
);

test(
  caseTitle('state.reduced-motion.forced', 'prefers-reduced-motion matches'),
  async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'reduced-motion',
      'applies to the reduced-motion project only',
    );

    await page.goto('/');

    const matches: boolean = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    expect(matches).toBe(true);
  },
);
