import * as z from 'zod/mini';

import { CONTACT_FORM_COPY } from '@/content/contact-form.content';
import { CONTACT_LIMITS } from '@/sections/contact/contact.limits';

import type { ContactField, ContactFieldErrors } from '@/sections/contact/contact.types';

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;

const CONTACT_FIELDS: readonly ContactField[] = ['name', 'email', 'message'];

const CRLF = /\r\n/g;

const stripControls = (value: string): string => {
  return value.replace(CONTROL_CHARACTERS, '');
};

const normaliseNewlines = (value: string): string => {
  return value.replace(CRLF, '\n');
};

const { errors } = CONTACT_FORM_COPY;

export const contactSchema = z.object({
  name: z
    .string()
    .check(
      z.overwrite(stripControls),
      z.trim(),
      z.minLength(1, { error: errors.name }),
      z.maxLength(CONTACT_LIMITS.name, { error: errors.nameTooLong }),
    ),
  email: z
    .string()
    .check(
      z.overwrite(stripControls),
      z.trim(),
      z.maxLength(CONTACT_LIMITS.email, { error: errors.emailTooLong }),
      z.email({ error: errors.email }),
    ),
  message: z
    .string()
    .check(
      z.overwrite(normaliseNewlines),
      z.trim(),
      z.minLength(CONTACT_LIMITS.messageMin, { error: errors.message }),
      z.maxLength(CONTACT_LIMITS.message, { error: errors.messageTooLong }),
    ),
  website: z.string().check(z.maxLength(CONTACT_LIMITS.website)),
  startedAt: z.optional(z.string()),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type RawContactForm = Readonly<
  Record<'name' | 'email' | 'message' | 'website' | 'startedAt', string>
>;

const readField = (formData: FormData, name: string): string => {
  const value: FormDataEntryValue | null = formData.get(name);

  return typeof value === 'string' ? value : '';
};

export const readContactForm = (formData: FormData): RawContactForm => {
  return {
    name: readField(formData, 'name'),
    email: readField(formData, 'email'),
    message: readField(formData, 'message'),
    website: readField(formData, 'website'),
    startedAt: readField(formData, 'startedAt'),
  };
};

export const fieldErrorsOf = (error: z.core.$ZodError): ContactFieldErrors => {
  const result: Partial<Record<ContactField, string>> = {};

  for (const issue of error.issues) {
    const field: ContactField | undefined = CONTACT_FIELDS.find((name) => {
      return name === issue.path[0];
    });

    if (field !== undefined && result[field] === undefined) {
      result[field] = issue.message;
    }
  }

  return result;
};

export const validateContactForm = (
  raw: Readonly<Record<'name' | 'email' | 'message' | 'website', string>>,
): ContactFieldErrors | null => {
  const result = z.safeParse(contactSchema, raw);

  return result.success ? null : fieldErrorsOf(result.error);
};
