import type { FirstScreenCase } from '@tests/front/e2e/first-screen.cases';

export const CASES = [
  {
    id: 'spec.seo.title-description',
    source: 'spec',
    reference: 'portfolio-spec FR-052, SC-019; src/content/site.content.ts',
    expected:
      'title, meta description, og:title and twitter:title equal the copy v2 values (og and twitter use the shorter og title)',
  },
  {
    id: 'spec.seo.canonical',
    source: 'spec',
    reference: 'portfolio-spec FR-052',
    expected: 'canonical link is the site root URL',
  },
  {
    id: 'spec.seo.og-image',
    source: 'spec',
    reference: 'portfolio-spec FR-052; plan S23',
    expected: 'og:image answers 200 image/png and the PNG is 1200x630',
  },
  {
    id: 'spec.seo.keywords',
    source: 'owner-2026-10-08',
    reference: 'owner brief 2026-10-08 (SEO keywords, twenty values)',
    expected: 'meta keywords holds exactly the twenty owner keywords in order',
  },
  {
    id: 'spec.seo.json-ld-profile',
    source: 'owner-2026-10-08',
    reference: 'owner brief 2026-10-08 (ProfilePage graph); schema.org ProfilePage, Person',
    expected:
      'one JSON-LD block: ProfilePage with url, inLanguage en and a Person mainEntity with name, jobTitle, description, url, image, sameAs, knowsAbout, PostalAddress Kyiv UA and no email',
  },
  {
    id: 'spec.seo.icons',
    source: 'owner-2026-10-08',
    reference:
      'owner brief 2026-10-08 (icons SVG, PNG 192 and 512, apple-touch-icon 180, manifest)',
    expected:
      'head links an svg icon and an apple-touch-icon; the PNG icons answer 200 image/png at 180, 192 and 512; the manifest names the site, is standalone and lists 192 and 512',
  },
  {
    id: 'spec.seo.proxy-routes',
    source: 'security-md',
    reference: 'rules/security.md §3 (CSP set per request in the proxy)',
    expected:
      'the page / carries a Content-Security-Policy and a path that only resembles a static route (/apple-iconX) is not skipped by the proxy',
  },
  {
    id: 'spec.seo.headings',
    source: 'owner-2026-10-08',
    reference: 'owner brief 2026-10-08 (one h1, each station title an h2); copy v2 station titles',
    expected:
      'the text version has one h1 and eight h2 with the copy v2 station titles in copy order (deploy before systems)',
  },
  {
    id: 'spec.seo.non-production-noindex',
    source: 'owner-2026-10-08',
    reference: 'owner brief 2026-10-08 (only vorynka.dev is indexable; the e2e host is localhost)',
    expected:
      'on the localhost test host robots.txt disallows / without a sitemap line and every page answers X-Robots-Tag noindex, nofollow',
  },
  {
    id: 'spec.seo.sitemap',
    source: 'owner-2026-10-08',
    reference: 'owner brief 2026-10-08 (sitemap lastModified)',
    expected: 'sitemap.xml lists the root with a lastmod date',
  },
] as const satisfies readonly FirstScreenCase[];

export type SeoCaseId = (typeof CASES)[number]['id'];
