import type { ContactSchemaCaseId } from '@tests/back/sections/contact/contact-schema.cases';

export type ContactSchemaMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly ContactSchemaCaseId[];
}>;

const SCHEMA = 'src/sections/contact/contact.schema.ts';

export const CONTACT_SCHEMA_MUTATIONS: readonly ContactSchemaMutation[] = [
  {
    id: 'name.max-raised',
    file: SCHEMA,
    find: 'name: 80,',
    replace: 'name: 81,',
    caseIds: ['sec.schema.name.bounds'],
  },
  {
    id: 'name.min-dropped',
    file: SCHEMA,
    find: 'z.minLength(1, { error: errors.name }),',
    replace: '',
    caseIds: ['sec.schema.name.empty', 'sec.schema.name.controls-only'],
  },
  {
    id: 'name.untrimmed',
    file: SCHEMA,
    find: 'z.trim(),',
    nth: 1,
    replace: '',
    caseIds: ['sec.schema.valid', 'sec.schema.name.empty'],
  },
  {
    id: 'name.controls-kept',
    file: SCHEMA,
    find: 'z.overwrite(stripControls),',
    nth: 1,
    replace: '',
    caseIds: ['sec.schema.name.controls', 'sec.schema.name.controls-only'],
  },
  {
    id: 'controls.newlines-kept',
    file: SCHEMA,
    find: '/[\\u0000-\\u001F\\u007F]/g',
    replace: '/[\\u0000-\\u0009\\u000B\\u000C\\u000E-\\u001F\\u007F]/g',
    caseIds: ['sec.schema.name.controls'],
  },
  {
    id: 'email.max-raised',
    file: SCHEMA,
    find: 'email: 254,',
    replace: 'email: 255,',
    caseIds: ['sec.schema.email.bounds'],
  },
  {
    id: 'email.any-string',
    file: SCHEMA,
    find: 'z.email({ error: errors.email }),',
    replace: '',
    caseIds: ['sec.schema.email.invalid', 'sec.schema.email.header-injection'],
  },
  {
    id: 'email.controls-kept',
    file: SCHEMA,
    find: 'z.overwrite(stripControls),',
    nth: 2,
    replace: '',
    caseIds: ['sec.schema.email.trim-and-controls'],
  },
  {
    id: 'message.min-lowered',
    file: SCHEMA,
    find: 'messageMin: 10,',
    replace: 'messageMin: 9,',
    caseIds: ['sec.schema.message.bounds'],
  },
  {
    id: 'message.max-raised',
    file: SCHEMA,
    find: 'message: 4000,',
    replace: 'message: 4001,',
    caseIds: ['sec.schema.message.bounds'],
  },
  {
    id: 'message.untrimmed',
    file: SCHEMA,
    find: '      z.trim(),\n      z.minLength(CONTACT_LIMITS.messageMin',
    replace: '      z.minLength(CONTACT_LIMITS.messageMin',
    caseIds: ['sec.schema.message.bounds', 'sec.schema.message.multiline'],
  },
  {
    id: 'message.controls-stripped',
    file: SCHEMA,
    find: '      z.trim(),\n      z.minLength(CONTACT_LIMITS.messageMin',
    replace:
      '      z.overwrite(stripControls),\n      z.trim(),\n      z.minLength(CONTACT_LIMITS.messageMin',
    caseIds: ['sec.schema.message.multiline'],
  },
  {
    id: 'message.crlf-kept',
    file: SCHEMA,
    find: '      z.overwrite(normaliseNewlines),\n',
    replace: '',
    caseIds: ['sec.schema.message.crlf', 'sec.schema.message.multiline'],
  },
  {
    id: 'name.max-copy-is-min-copy',
    file: SCHEMA,
    find: 'errors.nameTooLong',
    replace: 'errors.name',
    caseIds: ['sec.schema.name.bounds', 'sec.schema.field-errors'],
  },
  {
    id: 'email.max-copy-is-min-copy',
    file: SCHEMA,
    find: 'errors.emailTooLong',
    replace: 'errors.email',
    caseIds: ['sec.schema.email.bounds', 'sec.schema.field-errors'],
  },
  {
    id: 'message.max-copy-is-min-copy',
    file: SCHEMA,
    find: 'errors.messageTooLong',
    replace: 'errors.message',
    caseIds: ['sec.schema.message.bounds', 'sec.schema.message.crlf'],
  },
  {
    id: 'field-errors.last-wins',
    file: SCHEMA,
    find: 'field !== undefined && result[field] === undefined',
    replace: 'field !== undefined',
    caseIds: ['sec.schema.field-errors'],
  },
  {
    id: 'website.unbounded',
    file: SCHEMA,
    find: 'website: z.string().check(z.maxLength(CONTACT_LIMITS.website)),',
    replace: 'website: z.string(),',
    caseIds: ['sec.schema.website.bounds'],
  },
  {
    id: 'company.passthrough',
    file: SCHEMA,
    find: 'startedAt: z.optional(z.string()),',
    replace: 'startedAt: z.optional(z.string()),\n  company: z.optional(z.string()),',
    caseIds: ['sec.schema.no-company'],
  },
  {
    id: 'field-errors.website-leaks',
    file: SCHEMA,
    find: "CONTACT_FIELDS: readonly ContactField[] = ['name', 'email', 'message'];",
    replace:
      "CONTACT_FIELDS: readonly ContactField[] = ['name', 'email', 'message', 'website' as ContactField];",
    caseIds: ['sec.schema.field-errors'],
  },
  {
    id: 'read.file-stringified',
    file: SCHEMA,
    find: "return typeof value === 'string' ? value : '';",
    replace: "return value === null ? '' : String(value);",
    caseIds: ['sec.schema.read-form'],
  },
];

export type EquivalentContactSchemaMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  reason: string;
}>;

export const EQUIVALENT_CONTACT_SCHEMA_MUTATIONS: readonly EquivalentContactSchemaMutation[] = [];
