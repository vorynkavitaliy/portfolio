import type { HandleContactCaseId } from '@tests/back/sections/contact/handle-contact.cases';

export type HandleContactMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly HandleContactCaseId[];
}>;

const HANDLE = 'src/sections/contact/actions/handle-contact.ts';
const ACTION = 'src/sections/contact/actions/send-message.action.ts';

const LIMITER_BLOCK =
  "  if (!deps.takeToken(deps.ip)) {\n    return { status: 'error', code: 'RATE_LIMITED', fieldErrors: null };\n  }\n\n";

const READ_LINE = '  const raw: RawContactForm = readContactForm(formData);\n\n';

const BOT_BLOCK =
  "  if (isBotSubmission(raw, deps.now)) {\n    return { status: 'sent' };\n  }\n\n";

const PARSE_LINE = '  const parsed = contactSchema.safeParse(raw);\n\n';

const VERIFY_BLOCK =
  "  const verdict: TurnstileResult = await deps.verify({\n    token: turnstileToken(formData),\n    ip: deps.ip,\n    action: TURNSTILE_ACTION,\n  });\n\n  if (!verdict.ok) {\n    return { status: 'error', code: 'VERIFICATION_FAILED', fieldErrors: null };\n  }\n\n";

const ZOD_BLOCK =
  "  if (!parsed.success) {\n    return { status: 'error', code: 'INVALID_INPUT', fieldErrors: fieldErrorsOf(parsed.error) };\n  }\n\n";

export const HANDLE_CONTACT_MUTATIONS: readonly HandleContactMutation[] = [
  {
    id: 'limiter.removed',
    file: HANDLE,
    find: LIMITER_BLOCK,
    replace: '',
    caseIds: ['sec.contact.limiter-first', 'sec.contact.burst', 'sec.contact.action-wiring'],
  },
  {
    id: 'order.parse-before-limiter',
    file: HANDLE,
    find: `${LIMITER_BLOCK}${READ_LINE}`,
    replace: `${READ_LINE}${LIMITER_BLOCK}`,
    caseIds: ['sec.contact.limiter-first'],
  },
  {
    id: 'order.zod-before-anti-bot',
    file: HANDLE,
    find: `${BOT_BLOCK}${VERIFY_BLOCK}${PARSE_LINE}${ZOD_BLOCK}`,
    replace: `${PARSE_LINE}${ZOD_BLOCK}${BOT_BLOCK}${VERIFY_BLOCK}`,
    caseIds: ['sec.contact.bot-before-zod'],
  },
  {
    id: 'limiter.wrong-key',
    file: HANDLE,
    find: 'deps.takeToken(deps.ip)',
    replace: "deps.takeToken('everyone')",
    caseIds: ['sec.contact.limiter-key'],
  },
  {
    id: 'honeypot.inverted',
    file: HANDLE,
    find: 'if (isBotSubmission(raw, deps.now)) {',
    replace: 'if (!isBotSubmission(raw, deps.now)) {',
    caseIds: ['sec.contact.honeypot', 'sec.contact.too-fast', 'sec.contact.valid'],
  },
  {
    id: 'bot.loud',
    file: HANDLE,
    find: "  if (isBotSubmission(raw, deps.now)) {\n    return { status: 'sent' };",
    replace:
      "  if (isBotSubmission(raw, deps.now)) {\n    return { status: 'error', code: 'INVALID_INPUT', fieldErrors: null };",
    caseIds: ['sec.contact.honeypot', 'sec.contact.too-fast', 'sec.contact.bot-before-zod'],
  },
  {
    id: 'bot.still-sends',
    file: HANDLE,
    find: "  if (isBotSubmission(raw, deps.now)) {\n    return { status: 'sent' };\n  }",
    replace:
      "  if (isBotSubmission(raw, deps.now)) {\n    await deps.send({ name: raw.name, email: raw.email, message: raw.message });\n\n    return { status: 'sent' };\n  }",
    caseIds: ['sec.contact.honeypot', 'sec.contact.too-fast', 'sec.contact.bot-before-zod'],
  },
  {
    id: 'zod.skipped',
    file: HANDLE,
    find: 'if (!parsed.success) {',
    replace: 'if (parsed.success === undefined) {',
    caseIds: ['sec.contact.invalid', 'sec.contact.burst'],
  },
  {
    id: 'send.raw-input',
    file: HANDLE,
    find: 'await deps.send({ name, email, message });',
    replace: 'await deps.send({ name: raw.name, email: raw.email, message: raw.message });',
    caseIds: ['sec.contact.valid'],
  },
  {
    id: 'send.twice',
    file: HANDLE,
    find: 'const result: MailResult = await deps.send({ name, email, message });',
    replace:
      'await deps.send({ name, email, message });\n  const result: MailResult = await deps.send({ name, email, message });',
    caseIds: ['sec.contact.valid', 'sec.contact.no-js', 'sec.contact.action-wiring'],
  },
  {
    id: 'send-failed.as-sent',
    file: HANDLE,
    find: 'return result.ok\n',
    replace: 'return result.ok || !result.ok\n',
    caseIds: ['sec.contact.send-failed'],
  },
  {
    id: 'error.text-in-state',
    file: HANDLE,
    find: "{ status: 'error', code: 'SEND_FAILED', fieldErrors: null }",
    replace:
      "{ status: 'error', code: 'SEND_FAILED', fieldErrors: { message: 'SMTP 535 authentication failed' } }",
    caseIds: ['sec.contact.send-failed'],
  },
  {
    id: 'rate-limited.field-errors',
    file: HANDLE,
    find: "code: 'RATE_LIMITED', fieldErrors: null",
    replace: "code: 'RATE_LIMITED', fieldErrors: {}",
    caseIds: ['sec.contact.limiter-first'],
  },
  {
    id: 'action.wrong-header',
    file: ACTION,
    find: 'getServerEnv().CLIENT_IP_HEADER',
    replace: "'x-forwarded-for'",
    caseIds: ['sec.contact.action-wiring'],
  },
  {
    id: 'action.no-limiter',
    file: ACTION,
    find: 'takeToken: takeContactToken,',
    replace: 'takeToken: () => {\n      return true;\n    },',
    caseIds: ['sec.contact.action-wiring'],
  },
  {
    id: 'action.frozen-clock',
    file: ACTION,
    find: 'now: Date.now(),',
    replace: 'now: 0,',
    caseIds: ['sec.contact.action-wiring'],
  },
  {
    id: 'turnstile.removed',
    file: HANDLE,
    find: VERIFY_BLOCK,
    replace: '',
    caseIds: [
      'sec.contact.turnstile-request',
      'sec.contact.turnstile-failed',
      'sec.contact.turnstile-before-zod',
      'sec.contact.no-js-no-token',
      'sec.contact.action-wiring',
    ],
  },
  {
    id: 'turnstile.result-ignored',
    file: HANDLE,
    find: '  if (!verdict.ok) {',
    replace: '  if (verdict.ok === undefined) {',
    caseIds: [
      'sec.contact.turnstile-failed',
      'sec.contact.turnstile-before-zod',
      'sec.contact.no-js-no-token',
      'sec.contact.action-wiring',
    ],
  },
  {
    id: 'turnstile.before-anti-bot',
    file: HANDLE,
    find: `${BOT_BLOCK}${VERIFY_BLOCK}`,
    replace: `${VERIFY_BLOCK}${BOT_BLOCK}`,
    caseIds: ['sec.contact.turnstile-after-bot'],
  },
  {
    id: 'turnstile.before-limiter',
    file: HANDLE,
    find: `${LIMITER_BLOCK}${READ_LINE}${BOT_BLOCK}${VERIFY_BLOCK}`,
    replace: `${READ_LINE}${VERIFY_BLOCK}${LIMITER_BLOCK}${BOT_BLOCK}`,
    caseIds: ['sec.contact.limiter-first'],
  },
  {
    id: 'turnstile.after-zod',
    file: HANDLE,
    find: `${VERIFY_BLOCK}${PARSE_LINE}${ZOD_BLOCK}`,
    replace: `${PARSE_LINE}${ZOD_BLOCK}${VERIFY_BLOCK}`,
    caseIds: ['sec.contact.turnstile-before-zod'],
  },
  {
    id: 'turnstile.wrong-field',
    file: HANDLE,
    find: 'formData.get(TURNSTILE_FIELD)',
    replace: "formData.get('turnstile')",
    caseIds: ['sec.contact.turnstile-request', 'sec.contact.action-wiring'],
  },
  {
    id: 'turnstile.wrong-ip',
    file: HANDLE,
    find: '    ip: deps.ip,\n    action: TURNSTILE_ACTION,',
    replace: "    ip: 'unknown',\n    action: TURNSTILE_ACTION,",
    caseIds: ['sec.contact.turnstile-request', 'sec.contact.action-wiring'],
  },
  {
    id: 'turnstile.wrong-action',
    file: HANDLE,
    find: '    action: TURNSTILE_ACTION,',
    replace: "    action: 'login',",
    caseIds: ['sec.contact.turnstile-request'],
  },
  {
    id: 'turnstile.failure-as-sent',
    file: HANDLE,
    find: "    return { status: 'error', code: 'VERIFICATION_FAILED', fieldErrors: null };",
    replace: "    return { status: 'sent' };",
    caseIds: [
      'sec.contact.turnstile-failed',
      'sec.contact.turnstile-before-zod',
      'sec.contact.no-js-no-token',
      'sec.contact.action-wiring',
    ],
  },
  {
    id: 'turnstile.failure-sends',
    file: HANDLE,
    find: "  if (!verdict.ok) {\n    return { status: 'error', code: 'VERIFICATION_FAILED'",
    replace:
      "  if (!verdict.ok) {\n    await deps.send({ name: raw.name, email: raw.email, message: raw.message });\n\n    return { status: 'error', code: 'VERIFICATION_FAILED'",
    caseIds: [
      'sec.contact.turnstile-failed',
      'sec.contact.turnstile-before-zod',
      'sec.contact.no-js-no-token',
      'sec.contact.action-wiring',
    ],
  },
  {
    id: 'action.no-turnstile',
    file: ACTION,
    find: '    verify: verifyTurnstile,',
    replace: '    verify: async () => {\n      return { ok: true };\n    },',
    caseIds: ['sec.contact.action-wiring'],
  },
];
