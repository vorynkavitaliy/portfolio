import type { SiteUrlCaseId } from '@tests/back/core/config/site-url.cases';

export type SiteUrlMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly SiteUrlCaseId[];
}>;

const SITE = 'src/core/config/site-url.ts';

export const SITE_URL_MUTATIONS: readonly SiteUrlMutation[] = [
  {
    id: 'explicit.ignored',
    file: SITE,
    find: 'if (explicit !== undefined) {',
    replace: 'if (explicit !== undefined && false) {',
    caseIds: ['site.url.explicit-wins'],
  },
  {
    id: 'vercel.http',
    file: SITE,
    find: 'new URL(`https://${parsed.data}`)',
    replace: 'new URL(`http://${parsed.data}`)',
    caseIds: ['site.url.vercel-fallback'],
  },
  {
    id: 'local.port-changed',
    file: SITE,
    find: "'http://localhost:3000'",
    replace: "'http://localhost:3001'",
    caseIds: ['site.url.local-default'],
  },
  {
    id: 'blank.not-unset',
    file: SITE,
    find: "return trimmed === '' ? undefined : trimmed;",
    replace: 'return trimmed;',
    caseIds: ['site.url.blank-is-unset'],
  },
  {
    id: 'blank.untrimmed',
    file: SITE,
    find: "(value ?? '').trim()",
    replace: "(value ?? '')",
    caseIds: ['site.url.blank-is-unset'],
  },
  {
    id: 'invalid.falls-back',
    file: SITE,
    find: "throw new Error('Invalid SITE_URL');",
    replace: 'return new URL(LOCAL_SITE_URL);',
    caseIds: ['site.url.invalid-throws'],
  },
  {
    id: 'scheme.any',
    file: SITE,
    find: 'z.url({ protocol: /^https?$/ })',
    replace: 'z.url()',
    caseIds: ['site.url.scheme-restricted'],
  },
  {
    id: 'vercel.host-unchecked',
    file: SITE,
    find: 'z.string().regex(/^[a-z0-9.-]+$/i)',
    replace: 'z.string()',
    caseIds: ['site.url.vercel-host-invalid'],
  },
  {
    id: 'get.ignores-env',
    file: SITE,
    find: 'resolveSiteUrl(process.env)',
    replace: 'resolveSiteUrl({})',
    caseIds: ['site.url.get-reads-process-env'],
  },
];
