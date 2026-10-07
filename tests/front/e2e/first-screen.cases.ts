export type FirstScreenCaseSource =
  'security-md' | 'spec' | 'wcag' | 'playwright-docs' | 'owner-2026-10-07';

export type FirstScreenCase = Readonly<{
  id: string;
  source: FirstScreenCaseSource;
  reference: string;
  expected: string;
}>;

export const FIRST_SCREEN_CASES = [
  {
    id: 'spec.first-screen.status',
    source: 'owner-2026-10-07',
    reference: 'owner decision 2026-10-07: the first screen is the route /',
    expected: '/ answers 200',
  },
  {
    id: 'spec.first-screen.h1-without-js',
    source: 'owner-2026-10-07',
    reference:
      'project non-negotiable 7 (the page is complete without JavaScript); owner decision 2026-10-07',
    expected: 'with JavaScript disabled the server HTML contains an h1 reading Vitalii Vorynka',
  },
  {
    id: 'sec.headers.present',
    source: 'security-md',
    reference: 'rules/security.md §3 Headers',
    expected:
      'the response carries Strict-Transport-Security max-age=63072000; includeSubDomains, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy denying camera, microphone, geolocation and payment, and a Content-Security-Policy with frame-ancestors none, form-action self and base-uri self',
  },
  {
    id: 'sec.headers.csp-default-script',
    source: 'security-md',
    reference:
      "rules/security.md §3 Content-Security-Policy; ADR-006 (per-request nonce + 'strict-dynamic', set in src/proxy.ts)",
    expected:
      "the response carries exactly one Content-Security-Policy header; it contains default-src 'self' and a script-src directive beginning 'self' that carries 'nonce-…' and 'strict-dynamic' and neither 'unsafe-inline' nor 'unsafe-eval'",
  },
  {
    id: 'sec.headers.csp-nonce-fresh',
    source: 'security-md',
    reference:
      'ADR-006; Next.js 16.4 guide «Content Security Policy»; data blocks (type="application/ld+json") excluded from nonce check (CSP does not apply to data blocks; the layout must not read headers() for a nonce)',
    expected:
      'two requests to / give two different nonces; every script tag (excluding data blocks) in the server HTML carries the nonce of its own response; in the browser the page hydrates (window.next is set) with no securitypolicyviolation event',
  },
  {
    id: 'sec.headers.no-powered-by',
    source: 'owner-2026-10-07',
    reference: 'owner decision 2026-10-07 (poweredByHeader false)',
    expected: 'the response has no X-Powered-By header',
  },
  {
    id: 'wcag.axe.no-violations',
    source: 'wcag',
    reference: 'WCAG 2.2 A and AA as checked by axe-core; zero violations on /',
    expected: 'an axe scan of / reports zero violations',
  },
  {
    id: 'state.no-webgl.forced',
    source: 'playwright-docs',
    reference: 'project no-webgl launches Chromium with WebGL disabled',
    expected: 'in the no-webgl project a canvas yields no webgl2 and no webgl context',
  },
  {
    id: 'state.reduced-motion.forced',
    source: 'playwright-docs',
    reference: 'project reduced-motion sets the reducedMotion option to reduce',
    expected: 'in the reduced-motion project matchMedia (prefers-reduced-motion: reduce) matches',
  },
] as const satisfies readonly FirstScreenCase[];

export type FirstScreenCaseId = (typeof FIRST_SCREEN_CASES)[number]['id'];
