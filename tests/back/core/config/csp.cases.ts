export type CspCaseSource = 'security-md' | 'next-docs' | 'cloudflare-docs';

export type CspCase = Readonly<{
  id: string;
  source: CspCaseSource;
  reference: string;
  expected: string;
}>;

const DIRECTIVES =
  'rules/security.md §3 Content-Security-Policy (directives and order); plan 0002 §5.8';

const NONCE = 'ADR-006 per-request nonce; plan 0002 §5.8 (base64 of crypto.randomUUID())';

const TURNSTILE_CSP =
  'cloudflare-docs https://developers.cloudflare.com/turnstile/reference/content-security-policy/ (script-src and frame-src https://challenges.cloudflare.com; works with strict-dynamic; pre-clearance only needs connect-src self)';

export const CSP_CASES = [
  {
    id: 'sec.csp.exact.production',
    source: 'security-md',
    reference: DIRECTIVES,
    expected:
      "outside development the policy for nonce n0nce equals the twelve directives in order, script-src 'self' 'nonce-n0nce' 'strict-dynamic' https://challenges.cloudflare.com, frame-src https://challenges.cloudflare.com, joined by '; '",
  },
  {
    id: 'sec.csp.exact.development',
    source: 'next-docs',
    reference:
      "Next.js 16.4 guide «Content Security Policy»: 'unsafe-eval' is required in development only",
    expected:
      "in development the policy equals the production one with ' 'unsafe-eval'' appended to script-src and nothing else changed",
  },
  {
    id: 'sec.csp.script.no-unsafe',
    source: 'security-md',
    reference: `${DIRECTIVES} (no 'unsafe-inline' for scripts, no 'unsafe-eval' in production)`,
    expected:
      "outside development the script-src directive contains neither 'unsafe-inline' nor 'unsafe-eval'",
  },
  {
    id: 'sec.csp.nonce.carried',
    source: 'security-md',
    reference: NONCE,
    expected: "the script-src directive carries 'nonce-<n>' with the exact nonce passed in",
  },
  {
    id: 'sec.csp.nonce.fresh',
    source: 'security-md',
    reference: `${NONCE}; a nonce is unique for every request`,
    expected: 'one hundred calls to createNonce give one hundred distinct values',
  },
  {
    id: 'sec.csp.nonce.uuid-base64',
    source: 'security-md',
    reference: NONCE,
    expected:
      'a nonce is canonical base64 whose decoded text is a version 4 UUID, so it is 128 bits from the platform CSPRNG',
  },
  {
    id: 'sec.csp.turnstile.script',
    source: 'cloudflare-docs',
    reference: TURNSTILE_CSP,
    expected:
      "script-src lists https://challenges.cloudflare.com once, next to 'strict-dynamic', and no other remote origin",
  },
  {
    id: 'sec.csp.turnstile.frame',
    source: 'cloudflare-docs',
    reference: TURNSTILE_CSP,
    expected:
      "frame-src is exactly https://challenges.cloudflare.com while connect-src stays 'self' and frame-ancestors stays 'none'",
  },
] as const satisfies readonly CspCase[];

export type CspCaseId = (typeof CSP_CASES)[number]['id'];
