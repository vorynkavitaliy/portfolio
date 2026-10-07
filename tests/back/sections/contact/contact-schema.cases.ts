export type ContactSchemaCaseSource = 'spec' | 'security-md' | 'rfc-5321' | 'owner-2026-10-07';

export type ContactSchemaCase = Readonly<{
  id: string;
  source: ContactSchemaCaseSource;
  reference: string;
  expected: string;
}>;

const VALIDATION =
  'rules/security.md §1 «Validation» (name 1–80, email ≤ 254, message 10–4000, trimmed, control characters stripped from single-line fields)';

const MESSAGES =
  'spec FR-047 «each invalid field shows its message»; copy CONTACT_FORM_COPY.errors (src/content/contact-form.content.ts)';

const CONTRACT = 'plan 0002 §5.7 contact.schema (readContactForm, fieldErrorsOf, website ≤ 200)';

export const CONTACT_SCHEMA_CASES = [
  {
    id: 'sec.schema.valid',
    source: 'spec',
    reference: 'spec FR-046 (name, email, message, hidden honeypot)',
    expected: 'a valid form parses to the trimmed name, email and message',
  },
  {
    id: 'sec.schema.name.empty',
    source: 'security-md',
    reference: `${VALIDATION}; ${MESSAGES}`,
    expected: 'a blank or whitespace name fails with «Enter your name.»',
  },
  {
    id: 'sec.schema.name.bounds',
    source: 'security-md',
    reference: VALIDATION,
    expected:
      'names of 1 and 80 characters pass; 81 characters fail with «That name is too long. Shorten it.»',
  },
  {
    id: 'sec.schema.name.controls',
    source: 'security-md',
    reference: `${VALIDATION}; rules/security.md §5 header-injection attempt in name`,
    expected: 'the name «Ann\\r\\nBcc: x\\u0000\\u007F» parses to «AnnBcc: x»',
  },
  {
    id: 'sec.schema.name.controls-only',
    source: 'security-md',
    reference: VALIDATION,
    expected: 'a name made only of control characters fails with «Enter your name.»',
  },
  {
    id: 'sec.schema.email.invalid',
    source: 'spec',
    reference: MESSAGES,
    expected: '«not-an-email» fails with «Enter a valid email, like name@company.com.»',
  },
  {
    id: 'sec.schema.email.bounds',
    source: 'rfc-5321',
    reference: `RFC 5321 §4.5.3.1 with errata 1690 (a path holds at most 254 characters); ${VALIDATION}`,
    expected:
      'a 254-character address passes; 255 characters fail with «That email is too long. Check the address.»',
  },
  {
    id: 'sec.schema.email.trim-and-controls',
    source: 'security-md',
    reference: VALIDATION,
    expected: '« ann@example.test\\u0007 » parses to «ann@example.test»',
  },
  {
    id: 'sec.schema.email.header-injection',
    source: 'security-md',
    reference: 'rules/security.md §5 header-injection attempt in email',
    expected: '«ann@example.test\\r\\nBcc: x@evil.test» fails with the email message',
  },
  {
    id: 'sec.schema.message.bounds',
    source: 'security-md',
    reference: `${VALIDATION}; ${MESSAGES}`,
    expected:
      'messages of 10 and 4000 characters pass; 9 characters (after trim) fail with «Write at least 10 characters.»; 4001 characters fail with «That message is too long. Shorten it.»',
  },
  {
    id: 'sec.schema.message.crlf',
    source: 'spec',
    reference: `spec FR-047 «each invalid field shows its message»; ${VALIDATION}; HTML maxlength counts a textarea line break as one character, the submitted value carries CRLF`,
    expected:
      'a message of 3990 characters with 20 CRLF pairs passes; after CRLF becomes LF a message of 4001 characters fails with «That message is too long. Shorten it.»',
  },
  {
    id: 'sec.schema.message.multiline',
    source: 'security-md',
    reference: `${VALIDATION} (control stripping is for single-line fields only)`,
    expected:
      'line breaks inside the message are kept (CRLF becomes LF), the outer whitespace is trimmed',
  },
  {
    id: 'sec.schema.website.bounds',
    source: 'owner-2026-10-07',
    reference: CONTRACT,
    expected: 'a website of 200 characters passes the schema, 201 fails',
  },
  {
    id: 'sec.schema.no-company',
    source: 'spec',
    reference: 'spec FR-046 «no company field, Q-12»',
    expected: 'a company entry in the form is neither read nor present in the parsed data',
  },
  {
    id: 'sec.schema.field-errors',
    source: 'spec',
    reference: `${MESSAGES}; ${CONTRACT} «first message per field»`,
    expected:
      'fieldErrorsOf gives exactly one message per invalid field among name, email, message and nothing for valid fields or website',
  },
  {
    id: 'sec.schema.read-form',
    source: 'owner-2026-10-07',
    reference: `${CONTRACT} «non-string entries → ''»`,
    expected:
      'string entries are read as is; a File entry and a missing entry read as an empty string',
  },
] as const satisfies readonly ContactSchemaCase[];

export type ContactSchemaCaseId = (typeof CONTACT_SCHEMA_CASES)[number]['id'];
