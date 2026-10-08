export type MailCaseSource =
  'security-md' | 'spec' | 'nodemailer-docs' | 'owner-2026-10-07' | 'owner-2026-10-08';

export type MailCase = Readonly<{
  id: string;
  source: MailCaseSource;
  reference: string;
  expected: string;
}>;

const MAIL = 'rules/security.md §1 «Mail»';

const TLS =
  'plan 0002 D-12 (secure on 465, requireTLS for non-loopback hosts on other ports, loopback plain)';

const NODEMAILER_SMTP =
  'nodemailer-docs https://nodemailer.com/smtp/ (secure, requireTLS, tls, auth)';

export const MAIL_CASES = [
  {
    id: 'sec.mail.from-to-fixed',
    source: 'security-md',
    reference: `${MAIL} «fixed from / to from env»`,
    expected: 'from is CONTACT_FROM and to is CONTACT_TO, whatever the visitor typed',
  },
  {
    id: 'sec.mail.reply-to',
    source: 'spec',
    reference:
      'spec FR-048 «the visitor’s address as replyTo»; rules/security.md §1 «visitor email only in replyTo»',
    expected: 'replyTo is the visitor email and the visitor email is in no other address field',
  },
  {
    id: 'sec.mail.subject',
    source: 'security-md',
    reference: `${MAIL} «subject from a fixed prefix + newline-free name ≤ 80»; plan 0002 §5.7 CONTACT_SUBJECT_PREFIX`,
    expected: 'subject is «Portfolio contact: Ann Lee» for the name Ann Lee',
  },
  {
    id: 'sec.mail.subject.single-line',
    source: 'security-md',
    reference: `${MAIL} «newline-free name»; rules/security.md §5 header-injection attempt`,
    expected:
      'a name «Ann\\r\\nBcc: x@evil.test» gives the subject «Portfolio contact: AnnBcc: x@evil.test» with no CR or LF',
  },
  {
    id: 'sec.mail.subject.length',
    source: 'security-md',
    reference: `${MAIL} «name ≤ 80»`,
    expected: 'a 120-character name contributes its first 80 characters to the subject',
  },
  {
    id: 'sec.mail.text',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §5.7 buildContactMail text «Name: …\\nEmail: …\\n\\n<message>»',
    expected:
      'text is «Name: Ann Lee\\nEmail: ann@example.test\\n\\n» followed by the message with its line breaks',
  },
  {
    id: 'sec.mail.no-html',
    source: 'security-md',
    reference: `${MAIL} «body text only»`,
    expected: 'the mail has exactly the keys from, to, replyTo, subject, text and no html',
  },
  {
    id: 'sec.mail.sent-once',
    source: 'spec',
    reference: 'spec FR-048 «sends one email to the owner»',
    expected: 'the mailer calls the transport once with the built mail and returns { ok: true }',
  },
  {
    id: 'sec.mail.failure-code',
    source: 'security-md',
    reference: `${MAIL} «SMTP errors are logged as codes, never sent to the client»`,
    expected:
      'a transport error with code EAUTH gives { ok: false, code: SEND_FAILED } and console.error(«contact.mail.failed», «EAUTH») once',
  },
  {
    id: 'sec.mail.failure-no-text',
    source: 'security-md',
    reference: `${MAIL}; rules/security.md §2 «No secret, no visitor message and no visitor email in logs»`,
    expected:
      'neither the result nor the log contains the provider text, the SMTP password, the visitor email or the message',
  },
  {
    id: 'sec.mail.failure-unknown',
    source: 'security-md',
    reference: `${MAIL} «logged as codes»`,
    expected:
      'an error without a code, a thrown string or a code that is free text logs «UNKNOWN» and returns SEND_FAILED',
  },
  {
    id: 'sec.mail.tls.smtps',
    source: 'owner-2026-10-07',
    reference: `${TLS}; ${NODEMAILER_SMTP}`,
    expected: 'smtp.example.test:465 gives secure true',
  },
  {
    id: 'sec.mail.tls.submission',
    source: 'owner-2026-10-07',
    reference: `${TLS}; ${NODEMAILER_SMTP}`,
    expected: 'smtp.example.test:587 and :25 give secure false and requireTLS true',
  },
  {
    id: 'sec.mail.tls.loopback',
    source: 'owner-2026-10-07',
    reference: `${TLS} (Mailpit 127.0.0.1:1025)`,
    expected: '127.0.0.1:1025 and localhost:1025 give secure false and requireTLS false',
  },
  {
    id: 'sec.mail.tls.loopback-lookalike',
    source: 'owner-2026-10-07',
    reference: TLS,
    expected:
      'a remote host named 127.0.0.1.evil.test or localhost.evil.test on 587 still requires TLS',
  },
  {
    id: 'sec.mail.tls.min-version',
    source: 'owner-2026-10-07',
    reference: 'contact-form stack «tls.minVersion TLSv1.2, certificate verification on»',
    expected: 'tls is exactly { minVersion: TLSv1.2 } (no rejectUnauthorized override)',
  },
  {
    id: 'sec.mail.timeouts',
    source: 'owner-2026-10-08',
    reference:
      'owner 2026-10-08: the dev form hung on «Sending…» because the host blocks SMTP 465/587; a closed port must fail fast',
    expected: 'connectionTimeout 10000, greetingTimeout 10000, socketTimeout 20000 (ms)',
  },
  {
    id: 'sec.mail.auth-and-host',
    source: 'security-md',
    reference: 'rules/security.md §2 «SMTP host, port, user, password … only in env»',
    expected: 'host, port, auth.user and auth.pass are the env values',
  },
  {
    id: 'sec.mail.transport.lazy-once',
    source: 'owner-2026-10-07',
    reference:
      'contact-form stack «Transport lifetime: once per server instance (module scope, lazily)»',
    expected:
      'importing the module creates no transport; two sends create exactly one transport with transportOptions(env) and send two mails',
  },
] as const satisfies readonly MailCase[];

export type MailCaseId = (typeof MAIL_CASES)[number]['id'];
