import type { IndexingCaseId } from '@tests/back/core/config/indexing.cases';

export type IndexingMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly IndexingCaseId[];
}>;

const INDEXING = 'src/core/config/indexing.ts';

export const INDEXING_MUTATIONS: readonly IndexingMutation[] = [
  {
    id: 'host-suffix-match',
    file: INDEXING,
    find: 'site.hostname === PRODUCTION_HOSTNAME',
    replace: 'site.hostname.endsWith(PRODUCTION_HOSTNAME)',
    caseIds: ['indexing.other-hosts'],
  },
  {
    id: 'host-never-indexable',
    file: INDEXING,
    find: 'site.hostname === PRODUCTION_HOSTNAME',
    replace: 'false',
    caseIds: ['indexing.production-host', 'indexing.robots-production'],
  },
  {
    id: 'robots-ignores-host',
    file: INDEXING,
    find: 'if (!isIndexable(site)) {',
    replace: 'if (false) {',
    caseIds: ['indexing.robots-non-production'],
  },
  {
    id: 'robots-sitemap-dropped',
    file: INDEXING,
    find: "    sitemap: new URL('/sitemap.xml', site).href,\n",
    replace: '',
    caseIds: ['indexing.robots-production'],
  },
  {
    id: 'sitemap-last-modified-dropped',
    file: INDEXING,
    find: ', lastModified }',
    replace: ' }',
    caseIds: ['indexing.sitemap-last-modified'],
  },
];
