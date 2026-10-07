import { expect, vi } from 'vitest';

import { caseTest } from '@tests/back/core/config/site-url.case-test';
import { getSiteUrl, resolveSiteUrl } from '@/core/config/site-url';

caseTest('site.url.explicit-wins', 'SITE_URL beats the Vercel host', () => {
  const result: URL = resolveSiteUrl({
    SITE_URL: 'https://vitalii.example.test',
    VERCEL_PROJECT_PRODUCTION_URL: 'project.vercel.test',
  });

  expect(result.href).toBe('https://vitalii.example.test/');
});

caseTest('site.url.vercel-fallback', 'host gets https', () => {
  const result: URL = resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'project.vercel.test' });

  expect(result.href).toBe('https://project.vercel.test/');
});

caseTest('site.url.local-default', 'localhost:3000', () => {
  expect(resolveSiteUrl({}).href).toBe('http://localhost:3000/');
});

caseTest('site.url.blank-is-unset', 'empty and whitespace fall through', () => {
  const vercel = 'project.vercel.test';

  expect(resolveSiteUrl({ SITE_URL: '', VERCEL_PROJECT_PRODUCTION_URL: vercel }).href).toBe(
    'https://project.vercel.test/',
  );

  expect(resolveSiteUrl({ SITE_URL: '   ', VERCEL_PROJECT_PRODUCTION_URL: vercel }).href).toBe(
    'https://project.vercel.test/',
  );

  expect(resolveSiteUrl({ SITE_URL: '' }).href).toBe('http://localhost:3000/');
});

caseTest('site.url.invalid-throws', 'not a URL, no fallback', () => {
  expect(() => {
    resolveSiteUrl({ SITE_URL: 'not a url', VERCEL_PROJECT_PRODUCTION_URL: 'project.vercel.test' });
  }).toThrow('Invalid SITE_URL');
});

caseTest('site.url.scheme-restricted', 'ftp and javascript rejected', () => {
  expect(() => {
    resolveSiteUrl({ SITE_URL: 'ftp://files.example.test' });
  }).toThrow('Invalid SITE_URL');

  expect(() => {
    resolveSiteUrl({ SITE_URL: 'javascript:alert(1)' });
  }).toThrow('Invalid SITE_URL');
});

caseTest('site.url.vercel-host-invalid', 'slash or space rejected', () => {
  expect(() => {
    resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'project.vercel.test/path' });
  }).toThrow('Invalid VERCEL_PROJECT_PRODUCTION_URL');

  expect(() => {
    resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'project vercel' });
  }).toThrow('Invalid VERCEL_PROJECT_PRODUCTION_URL');
});

caseTest('site.url.get-reads-process-env', 'stubbed env is seen', () => {
  vi.stubEnv('SITE_URL', 'https://stubbed.example.test');
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');

  expect(getSiteUrl().href).toBe('https://stubbed.example.test/');
});
