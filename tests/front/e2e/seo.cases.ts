import type { FirstScreenCase } from '@tests/front/e2e/first-screen.cases';

export const CASES = [
  {
    id: 'spec.seo.title-description',
    source: 'spec',
    reference: 'portfolio-spec FR-052, SC-019; src/content/site.content.ts',
    expected: 'title and meta description equal the site copy',
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
    id: 'spec.seo.json-ld-person',
    source: 'spec',
    reference: 'portfolio-spec FR-052',
    expected: 'a JSON-LD block has @type Person with the site name',
  },
  {
    id: 'spec.seo.sitemap-robots',
    source: 'spec',
    reference: 'portfolio-spec FR-052',
    expected: 'sitemap.xml lists the root; robots.txt allows / and names the sitemap',
  },
] as const satisfies readonly FirstScreenCase[];

export type SeoCaseId = (typeof CASES)[number]['id'];
