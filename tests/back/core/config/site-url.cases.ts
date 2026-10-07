export type SiteUrlCaseSource = 'security-md' | 'owner-2026-10-07';

export type SiteUrlCase = Readonly<{
  id: string;
  source: SiteUrlCaseSource;
  reference: string;
  expected: string;
}>;

const RESOLUTION = 'plan 0002 §7 «Env»: SITE_URL → VERCEL_PROJECT_PRODUCTION_URL → localhost';

const VALIDATION = 'rules/security.md §1 (validate every runtime input with zod)';

export const SITE_URL_CASES = [
  {
    id: 'site.url.explicit-wins',
    source: 'owner-2026-10-07',
    reference: RESOLUTION,
    expected: 'with SITE_URL and the Vercel host both set, the result is SITE_URL',
  },
  {
    id: 'site.url.vercel-fallback',
    source: 'owner-2026-10-07',
    reference: RESOLUTION,
    expected: 'with only the Vercel production host set, the result is https:// plus that host',
  },
  {
    id: 'site.url.local-default',
    source: 'owner-2026-10-07',
    reference: RESOLUTION,
    expected: 'with neither variable set, the result is http://localhost:3000',
  },
  {
    id: 'site.url.blank-is-unset',
    source: 'owner-2026-10-07',
    reference: '.env.example lists names with empty values; empty SITE_URL counts as unset',
    expected: 'an empty or whitespace SITE_URL falls through to the Vercel host',
  },
  {
    id: 'site.url.invalid-throws',
    source: 'security-md',
    reference: VALIDATION,
    expected: 'a SITE_URL that is not a URL throws «Invalid SITE_URL» and does not fall back',
  },
  {
    id: 'site.url.scheme-restricted',
    source: 'security-md',
    reference: VALIDATION,
    expected: 'a SITE_URL with the ftp or javascript scheme throws «Invalid SITE_URL»',
  },
  {
    id: 'site.url.vercel-host-invalid',
    source: 'security-md',
    reference: VALIDATION,
    expected: 'a Vercel host with a slash or space throws «Invalid VERCEL_PROJECT_PRODUCTION_URL»',
  },
  {
    id: 'site.url.get-reads-process-env',
    source: 'owner-2026-10-07',
    reference: RESOLUTION,
    expected: 'getSiteUrl reads SITE_URL from process.env at call time',
  },
] as const satisfies readonly SiteUrlCase[];

export type SiteUrlCaseId = (typeof SITE_URL_CASES)[number]['id'];
