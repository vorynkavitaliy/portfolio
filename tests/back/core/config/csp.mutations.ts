import type { CspCaseId } from '@tests/back/core/config/csp.cases';

export type CspMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly CspCaseId[];
}>;

const CSP = 'src/core/config/csp.ts';

export const CSP_MUTATIONS: readonly CspMutation[] = [
  {
    id: 'frame-ancestors.dropped',
    file: CSP,
    find: `    "frame-ancestors 'none'",\n`,
    replace: '',
    caseIds: ['sec.csp.exact.production', 'sec.csp.exact.development'],
  },
  {
    id: 'script.unsafe-inline-added',
    file: CSP,
    find: '    TURNSTILE_ORIGIN,\n  ];',
    replace: `    TURNSTILE_ORIGIN,\n    "'unsafe-inline'",\n  ];`,
    caseIds: ['sec.csp.exact.production', 'sec.csp.exact.development', 'sec.csp.script.no-unsafe'],
  },
  {
    id: 'dev-flag.inverted',
    file: CSP,
    find: 'return (development ?',
    replace: 'return (!development ?',
    caseIds: ['sec.csp.exact.production', 'sec.csp.exact.development', 'sec.csp.script.no-unsafe'],
  },
  {
    id: 'nonce.ignored',
    file: CSP,
    find: "`'nonce-${nonce}'`",
    replace: '"\'nonce-static\'"',
    caseIds: ['sec.csp.exact.production', 'sec.csp.exact.development', 'sec.csp.nonce.carried'],
  },
  {
    id: 'nonce.constant',
    file: CSP,
    find: 'Buffer.from(crypto.randomUUID())',
    replace: "Buffer.from('6f1c2a4e-9b3d-4c8f-a1e2-7d5b3c9f0a14')",
    caseIds: ['sec.csp.nonce.fresh'],
  },
  {
    id: 'nonce.not-base64',
    file: CSP,
    find: ".toString('base64')",
    replace: ".toString('hex')",
    caseIds: ['sec.csp.nonce.uuid-base64'],
  },
  {
    id: 'turnstile.script-dropped',
    file: CSP,
    find: '    "\'strict-dynamic\'",\n    TURNSTILE_ORIGIN,\n',
    replace: '    "\'strict-dynamic\'",\n',
    caseIds: ['sec.csp.exact.production', 'sec.csp.exact.development', 'sec.csp.turnstile.script'],
  },
  {
    id: 'turnstile.frame-dropped',
    file: CSP,
    find: '    `frame-src ${TURNSTILE_ORIGIN}`,\n',
    replace: '',
    caseIds: ['sec.csp.exact.production', 'sec.csp.exact.development', 'sec.csp.turnstile.frame'],
  },
  {
    id: 'turnstile.frame-wildcard',
    file: CSP,
    find: '`frame-src ${TURNSTILE_ORIGIN}`',
    replace: '`frame-src ${TURNSTILE_ORIGIN} https:`',
    caseIds: ['sec.csp.exact.production', 'sec.csp.exact.development', 'sec.csp.turnstile.frame'],
  },
  {
    id: 'turnstile.connect-widened',
    file: CSP,
    find: `"connect-src 'self'",`,
    replace: "`connect-src 'self' ${TURNSTILE_ORIGIN}`,",
    caseIds: ['sec.csp.exact.production', 'sec.csp.exact.development', 'sec.csp.turnstile.frame'],
  },
  {
    id: 'turnstile.script-wildcard',
    file: CSP,
    find: "const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';",
    replace: "const TURNSTILE_ORIGIN = 'https://*.cloudflare.com';",
    caseIds: [
      'sec.csp.exact.production',
      'sec.csp.exact.development',
      'sec.csp.turnstile.script',
      'sec.csp.turnstile.frame',
    ],
  },
];
