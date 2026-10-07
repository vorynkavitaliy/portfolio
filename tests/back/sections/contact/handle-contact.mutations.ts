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
    find: `${BOT_BLOCK}${PARSE_LINE}`,
    replace: `${PARSE_LINE}${BOT_BLOCK}`.replace(
      '  if (isBotSubmission',
      "  if (!parsed.success) {\n    return { status: 'error', code: 'INVALID_INPUT', fieldErrors: fieldErrorsOf(parsed.error) };\n  }\n\n  if (isBotSubmission",
    ),
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
];
