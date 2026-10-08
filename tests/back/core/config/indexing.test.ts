import { expect } from 'vitest';

import { caseTest } from '@tests/back/core/config/indexing.case-test';
import { buildRobots, buildSitemap, isIndexable } from '@/core/config/indexing';

caseTest('indexing.production-host', 'vorynka.dev', () => {
  expect(isIndexable(new URL('https://vorynka.dev'))).toBe(true);
});

caseTest('indexing.other-hosts', 'dev, www, localhost, lookalike', () => {
  expect(isIndexable(new URL('https://dev.vorynka.dev'))).toBe(false);
  expect(isIndexable(new URL('https://www.vorynka.dev'))).toBe(false);
  expect(isIndexable(new URL('http://localhost:3000'))).toBe(false);
  expect(isIndexable(new URL('https://vorynka.dev.example.test'))).toBe(false);
});

caseTest('indexing.robots-production', 'allow and sitemap', () => {
  expect(buildRobots(new URL('https://vorynka.dev'))).toEqual({
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://vorynka.dev/sitemap.xml',
  });
});

caseTest('indexing.robots-non-production', 'disallow and no sitemap', () => {
  for (const host of ['https://dev.vorynka.dev', 'http://localhost:3000']) {
    expect(buildRobots(new URL(host))).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  }
});

caseTest('indexing.sitemap-last-modified', 'root with a date', () => {
  const entries = buildSitemap(new URL('https://vorynka.dev'), new Date('2026-10-08T00:00:00Z'));

  expect(entries).toHaveLength(1);
  expect(entries[0]?.url).toBe('https://vorynka.dev/');

  const modified = entries[0]?.lastModified;

  expect(modified).toEqual(new Date('2026-10-08T00:00:00Z'));
});
