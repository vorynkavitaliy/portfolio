import type { MailCaseId } from '@tests/back/server/mail/mail.cases';

export type MailMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly MailCaseId[];
}>;

const MAIL = 'src/server/mail/mail.ts';
const CONSTANTS = 'src/server/mail/mail.constants.ts';

export const MAIL_MUTATIONS: readonly MailMutation[] = [
  {
    id: 'from.visitor',
    file: MAIL,
    find: 'from: env.CONTACT_FROM,',
    replace: 'from: message.email,',
    caseIds: ['sec.mail.from-to-fixed', 'sec.mail.reply-to', 'sec.mail.sent-once'],
  },
  {
    id: 'to.visitor',
    file: MAIL,
    find: 'to: env.CONTACT_TO,',
    replace: 'to: message.email,',
    caseIds: ['sec.mail.reply-to', 'sec.mail.sent-once'],
  },
  {
    id: 'reply-to.from-swapped',
    file: MAIL,
    find: 'from: env.CONTACT_FROM,\n    to: env.CONTACT_TO,\n    replyTo: message.email,',
    replace: 'from: message.email,\n    to: env.CONTACT_TO,\n    replyTo: env.CONTACT_FROM,',
    caseIds: ['sec.mail.from-to-fixed', 'sec.mail.reply-to'],
  },
  {
    id: 'html.added',
    file: MAIL,
    find: '    text: `Name:',
    replace: '    html: `<p>${message.message}</p>`,\n    text: `Name:',
    caseIds: ['sec.mail.no-html', 'sec.mail.sent-once'],
  },
  {
    id: 'subject.crlf-kept',
    file: MAIL,
    find: "return value.replace(CONTROL_CHARACTERS, '').trim()",
    replace: 'return value.trim()',
    caseIds: ['sec.mail.subject.single-line'],
  },
  {
    id: 'subject.uncut',
    file: MAIL,
    find: '.slice(0, SUBJECT_NAME_MAX)',
    replace: '',
    caseIds: ['sec.mail.subject.length'],
  },
  {
    id: 'subject.prefix-changed',
    file: CONSTANTS,
    find: "'Portfolio contact:'",
    replace: "'Contact:'",
    caseIds: ['sec.mail.subject', 'sec.mail.sent-once'],
  },
  {
    id: 'text.no-blank-line',
    file: MAIL,
    find: '\\nEmail: ${message.email}\\n\\n',
    replace: '\\nEmail: ${message.email}\\n',
    caseIds: ['sec.mail.text'],
  },
  {
    id: 'send.twice',
    file: MAIL,
    find: '      await transport.sendMail(buildContactMail(message, env));',
    replace:
      '      await transport.sendMail(buildContactMail(message, env));\n      await transport.sendMail(buildContactMail(message, env));',
    caseIds: ['sec.mail.sent-once'],
  },
  {
    id: 'error.text-in-result',
    file: MAIL,
    find: "return { ok: false, code: 'SEND_FAILED' };",
    replace: 'return { ok: false, code: String(error) };',
    caseIds: ['sec.mail.failure-code', 'sec.mail.failure-no-text', 'sec.mail.failure-unknown'],
  },
  {
    id: 'error.text-in-log',
    file: MAIL,
    find: 'console.error(MAIL_FAILED_LOG, errorCodeOf(error));',
    replace: 'console.error(MAIL_FAILED_LOG, errorCodeOf(error), error);',
    caseIds: ['sec.mail.failure-code', 'sec.mail.failure-no-text'],
  },
  {
    id: 'error.message-logged',
    file: MAIL,
    find: 'console.error(MAIL_FAILED_LOG, errorCodeOf(error));',
    replace: 'console.error(MAIL_FAILED_LOG, errorCodeOf(error), message.email, message.message);',
    caseIds: ['sec.mail.failure-no-text'],
  },
  {
    id: 'error.code-unchecked',
    file: MAIL,
    find: 'z.string().regex(/^[A-Z0-9_]{1,32}$/)',
    replace: 'z.string()',
    caseIds: ['sec.mail.failure-unknown'],
  },
  {
    id: 'error.code-dropped',
    file: MAIL,
    find: 'return parsed.success ? parsed.data.code : UNKNOWN_MAIL_ERROR;',
    replace: 'return UNKNOWN_MAIL_ERROR;',
    caseIds: ['sec.mail.failure-code'],
  },
  {
    id: 'error.rethrown',
    file: MAIL,
    find: "      return { ok: false, code: 'SEND_FAILED' };",
    replace: '      throw error;',
    caseIds: ['sec.mail.failure-code', 'sec.mail.failure-no-text', 'sec.mail.failure-unknown'],
  },
  {
    id: 'tls.secure-off',
    file: MAIL,
    find: 'env.SMTP_PORT === SMTPS_PORT',
    replace: 'env.SMTP_PORT === 0',
    caseIds: ['sec.mail.tls.smtps'],
  },
  {
    id: 'tls.require-dropped',
    file: MAIL,
    find: 'requireTLS: !secure && !LOOPBACK_HOST.test(env.SMTP_HOST),',
    replace: 'requireTLS: false,',
    caseIds: [
      'sec.mail.tls.submission',
      'sec.mail.tls.loopback-lookalike',
      'sec.mail.transport.lazy-once',
    ],
  },
  {
    id: 'tls.required-on-loopback',
    file: MAIL,
    find: 'requireTLS: !secure && !LOOPBACK_HOST.test(env.SMTP_HOST),',
    replace: 'requireTLS: !secure,',
    caseIds: ['sec.mail.tls.loopback'],
  },
  {
    id: 'tls.loopback-unanchored',
    file: MAIL,
    find: '/^(localhost|::1|127(\\.\\d{1,3}){3})$/',
    replace: '/^(localhost|::1|127(\\.\\d{1,3}){3})/',
    caseIds: ['sec.mail.tls.loopback-lookalike'],
  },
  {
    id: 'tls.min-version-dropped',
    file: MAIL,
    find: "tls: { minVersion: 'TLSv1.2' },",
    replace: 'tls: { rejectUnauthorized: false },',
    caseIds: ['sec.mail.tls.min-version', 'sec.mail.transport.lazy-once'],
  },
  {
    id: 'auth.swapped',
    file: MAIL,
    find: 'auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },',
    replace: 'auth: { user: env.SMTP_USER, pass: env.SMTP_USER },',
    caseIds: ['sec.mail.auth-and-host', 'sec.mail.transport.lazy-once'],
  },
  {
    id: 'transport.per-send',
    file: MAIL,
    find: '  if (contactMailer === null) {',
    replace: '  if (contactMailer === null || contactMailer !== null) {',
    caseIds: ['sec.mail.transport.lazy-once'],
  },
];
