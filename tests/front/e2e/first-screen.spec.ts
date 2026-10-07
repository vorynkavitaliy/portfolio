import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import type { FirstScreenCaseId } from '@tests/front/e2e/first-screen.cases';

const caseTitle = (id: FirstScreenCaseId, description: string): string => {
  return `${id}: ${description}`;
};

const NONCE_SOURCE = /'nonce-([^']+)'/;

const SCRIPT_OPEN_TAG = /<script\b[^>]*>/g;

const nonceOf = (policy: string): string => {
  return NONCE_SOURCE.exec(policy)?.[1] ?? '';
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
  caseTitle('sec.headers.csp-default-script', 'default-src and a nonce script-src are set'),
  async ({ request }) => {
    const response = await request.get('/');

    const policies: string[] = response
      .headersArray()
      .filter((header) => {
        return header.name.toLowerCase() === 'content-security-policy';
      })
      .map((header) => {
        return header.value;
      });

    expect(policies).toHaveLength(1);

    const policy: string[] = (policies[0] ?? '').split('; ');

    expect(policy).toContain("default-src 'self'");

    const scriptSrc: string[] = (
      policy.find((directive: string) => {
        return directive.startsWith('script-src ');
      }) ?? ''
    ).split(' ');

    expect(scriptSrc.slice(0, 2)).toEqual(['script-src', "'self'"]);

    expect(
      scriptSrc.some((source: string) => {
        return /^'nonce-[A-Za-z0-9+/]+=*'$/.test(source);
      }),
    ).toBe(true);

    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  },
);

test(
  caseTitle('sec.headers.csp-nonce-fresh', 'nonce is fresh per request and on every script'),
  async ({ request, page }) => {
    const first = await request.get('/');
    const second = await request.get('/');

    const firstNonce: string = nonceOf(first.headers()['content-security-policy'] ?? '');
    const secondNonce: string = nonceOf(second.headers()['content-security-policy'] ?? '');

    expect(firstNonce).not.toBe('');
    expect(secondNonce).not.toBe('');
    expect(firstNonce).not.toBe(secondNonce);

    const scripts: string[] = [...(await first.text()).matchAll(SCRIPT_OPEN_TAG)]
      .map((match) => {
        return match[0];
      })
      .filter((tag) => {
        return !tag.includes('type="application/ld+json"');
      });

    expect(scripts.length).toBeGreaterThan(0);

    for (const tag of scripts) {
      expect(tag).toContain(`nonce="${firstNonce}"`);
    }

    await page.addInitScript(() => {
      const violations: string[] = [];

      Object.defineProperty(window, '__cspViolations', { value: violations });

      document.addEventListener(
        'securitypolicyviolation',
        (event: SecurityPolicyViolationEvent) => {
          violations.push(`${event.effectiveDirective} ${event.blockedURI}`);
        },
      );
    });

    await page.goto('/');

    await page.waitForFunction(() => {
      return 'next' in window;
    });

    const violations: unknown = await page.evaluate(() => {
      return Reflect.get(window, '__cspViolations');
    });

    expect(violations).toEqual([]);
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
