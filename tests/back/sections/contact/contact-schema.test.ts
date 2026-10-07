import { expect } from 'vitest';

import { caseTest } from '@tests/back/sections/contact/contact-schema.case-test';
import { contactSchema, fieldErrorsOf, readContactForm } from '@/sections/contact/contact.schema';

import type { RawContactForm } from '@/sections/contact/contact.schema';
import type { ContactFieldErrors } from '@/sections/contact/contact.types';

const NAME_ERROR = 'Enter your name.';
const EMAIL_ERROR = 'Enter a valid email, like name@company.com.';
const MESSAGE_ERROR = 'Write at least 10 characters.';
const NAME_TOO_LONG = 'That name is too long. Shorten it.';
const EMAIL_TOO_LONG = 'That email is too long. Check the address.';
const MESSAGE_TOO_LONG = 'That message is too long. Shorten it.';

const VALID: RawContactForm = {
  name: 'Ann Lee',
  email: 'ann@example.test',
  message: 'Hello, let us talk about a role.',
  website: '',
  startedAt: '1760000000000',
};

const errorsFor = (overrides: Partial<RawContactForm>): ContactFieldErrors | null => {
  const result = contactSchema.safeParse({ ...VALID, ...overrides });

  return result.success ? null : fieldErrorsOf(result.error);
};

const parsedField = (
  overrides: Partial<RawContactForm>,
  field: 'name' | 'email' | 'message',
): string | null => {
  const result = contactSchema.safeParse({ ...VALID, ...overrides });

  return result.success ? result.data[field] : null;
};

const emailOfLength = (length: number): string => {
  const local: string = 'a'.repeat(64);
  const domain: string = `${'b'.repeat(length - 64 - 1 - '.test'.length)}.test`;

  return `${local}@${domain}`;
};

caseTest('sec.schema.valid', 'trimmed fields', () => {
  const result = contactSchema.safeParse({
    ...VALID,
    name: '  Ann Lee ',
    email: ' ann@example.test ',
    message: '  Hello, let us talk about a role.  ',
  });

  expect(result.success).toBe(true);

  expect(result.data).toEqual({
    name: 'Ann Lee',
    email: 'ann@example.test',
    message: 'Hello, let us talk about a role.',
    website: '',
    startedAt: '1760000000000',
  });
});

caseTest('sec.schema.name.empty', 'blank name', () => {
  expect(errorsFor({ name: '' })).toEqual({ name: NAME_ERROR });
  expect(errorsFor({ name: '    ' })).toEqual({ name: NAME_ERROR });
});

caseTest('sec.schema.name.bounds', '1 to 80 characters', () => {
  expect(errorsFor({ name: 'A' })).toBeNull();
  expect(errorsFor({ name: 'A'.repeat(80) })).toBeNull();
  expect(errorsFor({ name: 'A'.repeat(81) })).toEqual({ name: NAME_TOO_LONG });
});

caseTest('sec.schema.name.controls', 'control characters are stripped', () => {
  expect(parsedField({ name: 'Ann\r\nBcc: x\u0000\u007F' }, 'name')).toBe('AnnBcc: x');
});

caseTest('sec.schema.name.controls-only', 'only control characters is empty', () => {
  expect(errorsFor({ name: '\u0001\u0007\u007F' })).toEqual({ name: NAME_ERROR });
});

caseTest('sec.schema.email.invalid', 'not an address', () => {
  expect(errorsFor({ email: 'not-an-email' })).toEqual({ email: EMAIL_ERROR });
});

caseTest('sec.schema.email.bounds', 'at most 254 characters', () => {
  expect(emailOfLength(254)).toHaveLength(254);
  expect(errorsFor({ email: emailOfLength(254) })).toBeNull();
  expect(errorsFor({ email: emailOfLength(255) })).toEqual({ email: EMAIL_TOO_LONG });
});

caseTest('sec.schema.email.trim-and-controls', 'trimmed and stripped', () => {
  expect(parsedField({ email: ' ann@example.test\u0007 ' }, 'email')).toBe('ann@example.test');
});

caseTest('sec.schema.email.header-injection', 'CRLF header attempt is rejected', () => {
  expect(errorsFor({ email: 'ann@example.test\r\nBcc: x@evil.test' })).toEqual({
    email: EMAIL_ERROR,
  });
});

caseTest('sec.schema.message.bounds', '10 to 4000 characters', () => {
  expect(errorsFor({ message: 'm'.repeat(10) })).toBeNull();
  expect(errorsFor({ message: 'm'.repeat(4000) })).toBeNull();
  expect(errorsFor({ message: `   ${'m'.repeat(9)}   ` })).toEqual({ message: MESSAGE_ERROR });
  expect(errorsFor({ message: 'm'.repeat(4001) })).toEqual({ message: MESSAGE_TOO_LONG });
});

caseTest('sec.schema.message.crlf', 'CRLF counts as one character', () => {
  const crlfMessage = (head: number): string => {
    return `${'m'.repeat(head)}${'\r\n'.repeat(20)}m`;
  };

  expect(crlfMessage(3969)).toHaveLength(4010);
  expect(parsedField({ message: crlfMessage(3969) }, 'message')).toHaveLength(3990);
  expect(errorsFor({ message: crlfMessage(3969) })).toBeNull();
  expect(errorsFor({ message: crlfMessage(3979) })).toBeNull();
  expect(errorsFor({ message: crlfMessage(3980) })).toEqual({ message: MESSAGE_TOO_LONG });
});

caseTest('sec.schema.message.multiline', 'line breaks survive', () => {
  expect(parsedField({ message: '\n  Hello,\r\nlet us talk.\n\nAnn  \n' }, 'message')).toBe(
    'Hello,\nlet us talk.\n\nAnn',
  );
});

caseTest('sec.schema.website.bounds', 'honeypot at most 200', () => {
  expect(contactSchema.safeParse({ ...VALID, website: 'w'.repeat(200) }).success).toBe(true);
  expect(contactSchema.safeParse({ ...VALID, website: 'w'.repeat(201) }).success).toBe(false);
});

caseTest('sec.schema.no-company', 'no company field', () => {
  const formData = new FormData();

  formData.set('name', 'Ann Lee');
  formData.set('company', 'Some Company');

  const raw: RawContactForm = readContactForm(formData);

  expect(Object.keys(raw).sort()).toEqual(['email', 'message', 'name', 'startedAt', 'website']);

  const result = contactSchema.safeParse({ ...VALID, company: 'Some Company' });

  expect(result.success).toBe(true);
  expect(result.data).not.toHaveProperty('company');
});

caseTest('sec.schema.field-errors', 'one message per invalid field', () => {
  expect(
    errorsFor({
      name: 'A'.repeat(81),
      email: 'x'.repeat(300),
      message: 'short',
      website: 'w'.repeat(201),
    }),
  ).toEqual({ name: NAME_TOO_LONG, email: EMAIL_TOO_LONG, message: MESSAGE_ERROR });

  expect(errorsFor({ email: 'nope' })).toEqual({ email: EMAIL_ERROR });
});

caseTest('sec.schema.read-form', 'strings only', () => {
  const formData = new FormData();

  formData.set('name', '  Ann  ');
  formData.set('email', 'ann@example.test');
  formData.set('message', new File(['payload'], 'message.txt', { type: 'text/plain' }));
  formData.set('startedAt', '1760000000000');

  expect(readContactForm(formData)).toEqual({
    name: '  Ann  ',
    email: 'ann@example.test',
    message: '',
    website: '',
    startedAt: '1760000000000',
  });
});
