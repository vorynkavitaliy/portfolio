export type TurnstileCaseSource = 'security-md' | 'cloudflare-docs' | 'owner-2026-10-07';

export type TurnstileCase = Readonly<{
  id: string;
  source: TurnstileCaseSource;
  reference: string;
  expected: string;
}>;

const SITEVERIFY =
  'cloudflare-docs https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ (POST secret, response, remoteip, idempotency_key; check success, hostname, action)';

const TESTING =
  'cloudflare-docs https://developers.cloudflare.com/turnstile/troubleshooting/testing/ (test secrets 1x…AA pass, 2x…AA fail, 3x…AA spent)';

const OWNER = 'owner decision 2026-10-07 (Turnstile on the contact form, closes Q-5)';

const NO_LEAK = 'rules/security.md §1 «SMTP errors are logged as codes, never sent to the client»';

export const TURNSTILE_CASES = [
  {
    id: 'sec.turnstile.success',
    source: 'cloudflare-docs',
    reference: SITEVERIFY,
    expected:
      'success true with the site hostname and action contact gives exactly { ok: true } after one POST to the siteverify URL',
  },
  {
    id: 'sec.turnstile.request-body',
    source: 'cloudflare-docs',
    reference: SITEVERIFY,
    expected:
      'the POST body carries exactly secret, response, remoteip and a fresh idempotency_key per call; an unknown IP leaves remoteip out',
  },
  {
    id: 'sec.turnstile.missing-token',
    source: 'owner-2026-10-07',
    reference: `${OWNER}; ${SITEVERIFY} (token max 2048 characters)`,
    expected:
      'an empty token and a 2049-character token give missing-token without a request; a 2048-character token is sent',
  },
  {
    id: 'sec.turnstile.rejected',
    source: 'cloudflare-docs',
    reference: `${SITEVERIFY}; ${NO_LEAK}`,
    expected:
      'success false with error-codes gives exactly { ok: false, code: rejected } and no provider text',
  },
  {
    id: 'sec.turnstile.hostname-mismatch',
    source: 'cloudflare-docs',
    reference: SITEVERIFY,
    expected: 'success true for another hostname, or with no hostname, gives hostname-mismatch',
  },
  {
    id: 'sec.turnstile.action-mismatch',
    source: 'cloudflare-docs',
    reference: SITEVERIFY,
    expected: 'success true for another action, or with no action, gives action-mismatch',
  },
  {
    id: 'sec.turnstile.test-secret',
    source: 'cloudflare-docs',
    reference: TESTING,
    expected:
      'with a Cloudflare test secret a success for example.com and an empty action passes; success false still fails; a real secret with the same answer fails',
  },
  {
    id: 'sec.turnstile.timeout',
    source: 'owner-2026-10-07',
    reference: `${OWNER} (3 s timeout)`,
    expected:
      'a siteverify call that never answers is still pending at 2999 ms and gives unavailable at 3000 ms',
  },
  {
    id: 'sec.turnstile.network-error',
    source: 'security-md',
    reference: NO_LEAK,
    expected: 'a rejected fetch and an HTTP 500 both give exactly { ok: false, code: unavailable }',
  },
  {
    id: 'sec.turnstile.bad-response',
    source: 'owner-2026-10-07',
    reference: `${OWNER} (validate the siteverify JSON with zod)`,
    expected: 'a non-JSON body and a JSON body without a boolean success give bad-response',
  },
  {
    id: 'sec.turnstile.wiring',
    source: 'owner-2026-10-07',
    reference: `${OWNER}; rules/security.md §2 (secrets only from env)`,
    expected:
      'verifyTurnstile posts TURNSTILE_SECRET_KEY, checks the SITE_URL hostname and gives unavailable when the answer takes 3000 ms',
  },
  {
    id: 'sec.turnstile.log-code-only',
    source: 'security-md',
    reference: `${NO_LEAK}; rules/security.md §2 «No secret … in logs»`,
    expected:
      'a failed verification logs exactly the log key and the code, never the token or the secret; a success logs nothing',
  },
] as const satisfies readonly TurnstileCase[];

export type TurnstileCaseId = (typeof TURNSTILE_CASES)[number]['id'];
