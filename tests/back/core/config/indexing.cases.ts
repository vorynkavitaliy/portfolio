export type IndexingCaseSource = 'owner-2026-10-08' | 'next-docs';

export type IndexingCase = Readonly<{
  id: string;
  source: IndexingCaseSource;
  reference: string;
  expected: string;
}>;

const OWNER = 'owner brief 2026-10-08: production host is vorynka.dev, everything else is noindex';

const ROBOTS_DOCS = 'next-docs app/robots.txt metadata file';

export const INDEXING_CASES = [
  {
    id: 'indexing.production-host',
    source: 'owner-2026-10-08',
    reference: OWNER,
    expected: 'https://vorynka.dev is indexable',
  },
  {
    id: 'indexing.other-hosts',
    source: 'owner-2026-10-08',
    reference: OWNER,
    expected: 'dev.vorynka.dev, www.vorynka.dev, localhost and a lookalike host are not indexable',
  },
  {
    id: 'indexing.robots-production',
    source: 'owner-2026-10-08',
    reference: `${OWNER}; ${ROBOTS_DOCS}`,
    expected: 'robots on vorynka.dev allows / for every agent and names the sitemap',
  },
  {
    id: 'indexing.robots-non-production',
    source: 'owner-2026-10-08',
    reference: `${OWNER}; ${ROBOTS_DOCS}`,
    expected: 'robots on dev.vorynka.dev and localhost disallows / and has no sitemap line',
  },
  {
    id: 'indexing.sitemap-last-modified',
    source: 'owner-2026-10-08',
    reference: 'owner brief 2026-10-08: sitemap carries lastModified',
    expected: 'the single sitemap entry is the site root and has a valid lastModified date',
  },
] as const satisfies readonly IndexingCase[];

export type IndexingCaseId = (typeof INDEXING_CASES)[number]['id'];
