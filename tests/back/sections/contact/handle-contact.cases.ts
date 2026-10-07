export type HandleContactCaseSource =
  'security-md' | 'spec' | 'owner-2026-10-07' | 'cloudflare-docs';

export type HandleContactCase = Readonly<{
  id: string;
  source: HandleContactCaseSource;
  reference: string;
  expected: string;
}>;

const ORDER =
  'rules/security.md §1 «Limiter first … before parsing or any work»; plan 0002 D-11 (limiter → anti-bot → zod → one mail call)';

const SILENT =
  'rules/security.md §1 «Anti-bot … answered with a silent { ok: true }»; spec FR-049 «bots get a silent success»';

const TURNSTILE =
  'owner decision 2026-10-07 (Turnstile, closes Q-5): limiter → honeypot/fill-time → Turnstile → zod → one mail call; a failed check is VERIFICATION_FAILED with no mail';

const SITEVERIFY =
  'cloudflare-docs https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ (the widget posts the token as cf-turnstile-response; validate it server-side with remoteip)';

export const HANDLE_CONTACT_CASES = [
  {
    id: 'sec.contact.limiter-first',
    source: 'security-md',
    reference: ORDER,
    expected:
      'with the limiter empty the result is RATE_LIMITED with fieldErrors null, the form data is never read, Turnstile is never asked and nothing is sent',
  },
  {
    id: 'sec.contact.limiter-key',
    source: 'security-md',
    reference: 'rules/security.md §1 «token bucket … per client IP»',
    expected: 'takeToken is called once per submission with the client IP from deps',
  },
  {
    id: 'sec.contact.burst',
    source: 'owner-2026-10-07',
    reference: `plan 0002 S11 tests «the 4th invalid submission from one IP → RATE_LIMITED»; ${ORDER}`,
    expected:
      'with a real IP-policy limiter, three invalid submissions give INVALID_INPUT and the fourth gives RATE_LIMITED',
  },
  {
    id: 'sec.contact.honeypot',
    source: 'security-md',
    reference: SILENT,
    expected:
      'a valid form with the honeypot filled gives { status: sent } and the outbox stays empty',
  },
  {
    id: 'sec.contact.too-fast',
    source: 'security-md',
    reference: SILENT,
    expected: 'a valid form started 1000 ms ago gives { status: sent } and the outbox stays empty',
  },
  {
    id: 'sec.contact.bot-before-zod',
    source: 'owner-2026-10-07',
    reference: `${ORDER}; ${SILENT} (a bot learns nothing, not even field errors)`,
    expected: 'an invalid form with the honeypot filled still gives { status: sent }',
  },
  {
    id: 'sec.contact.invalid',
    source: 'spec',
    reference: 'spec FR-047 (server validation, each invalid field has its message)',
    expected:
      'empty name and bad email give INVALID_INPUT with exactly those two copy messages and nothing is sent',
  },
  {
    id: 'sec.contact.valid',
    source: 'spec',
    reference: 'spec FR-048 «a valid submission sends one email»',
    expected:
      'a valid form sends exactly one message with the trimmed name, email and message and gives { status: sent }',
  },
  {
    id: 'sec.contact.no-js',
    source: 'spec',
    reference: 'spec FR-050; owner decision Q-21 (empty startedAt = human)',
    expected:
      'a valid form with a passing Turnstile token but without startedAt sends one message and gives { status: sent }',
  },
  {
    id: 'sec.contact.send-failed',
    source: 'spec',
    reference: 'spec FR-049 «nobody gets provider error text»; rules/security.md §1 «Mail»',
    expected:
      'a SEND_FAILED mail result gives exactly { status: error, code: SEND_FAILED, fieldErrors: null }',
  },
  {
    id: 'sec.contact.action-wiring',
    source: 'owner-2026-10-07',
    reference:
      'plan 0002 §5.7 sendMessageAction (clientIp(headers, CLIENT_IP_HEADER), Date.now, takeContactToken, sendContactMail)',
    expected:
      'four submissions started 60 s ago (wall clock) with one x-test-client-ip give sent ×3 then RATE_LIMITED, three siteverify calls carry TURNSTILE_SECRET_KEY and that IP, three mails reach the fake transport; another IP without startedAt still sends; a rejected token sends nothing',
  },
  {
    id: 'sec.contact.turnstile-request',
    source: 'cloudflare-docs',
    reference: `${SITEVERIFY}; ${TURNSTILE}`,
    expected:
      'Turnstile is asked once per human submission with the cf-turnstile-response value, the client IP and action contact; a missing field is sent as an empty token',
  },
  {
    id: 'sec.contact.turnstile-failed',
    source: 'owner-2026-10-07',
    reference: TURNSTILE,
    expected:
      'every Turnstile failure code gives exactly { status: error, code: VERIFICATION_FAILED, fieldErrors: null } and nothing is sent',
  },
  {
    id: 'sec.contact.turnstile-after-bot',
    source: 'owner-2026-10-07',
    reference: `${TURNSTILE}; ${SILENT}`,
    expected:
      'a filled honeypot or a too-fast submission gives { status: sent } without asking Turnstile',
  },
  {
    id: 'sec.contact.turnstile-before-zod',
    source: 'owner-2026-10-07',
    reference: TURNSTILE,
    expected:
      'an invalid form with a failing Turnstile token gives VERIFICATION_FAILED with fieldErrors null, not field errors',
  },
  {
    id: 'sec.contact.no-js-no-token',
    source: 'owner-2026-10-07',
    reference: `${TURNSTILE}; supersedes spec FR-050 (no-JS send) for the form, the direct email stays`,
    expected:
      'a valid plain POST without cf-turnstile-response gives VERIFICATION_FAILED and nothing is sent',
  },
] as const satisfies readonly HandleContactCase[];

export type HandleContactCaseId = (typeof HANDLE_CONTACT_CASES)[number]['id'];
