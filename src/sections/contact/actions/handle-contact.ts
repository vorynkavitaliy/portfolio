import 'server-only';

import { isBotSubmission } from '@/sections/contact/actions/anti-bot';
import { contactSchema, fieldErrorsOf, readContactForm } from '@/sections/contact/contact.schema';

import type { RawContactForm } from '@/sections/contact/contact.schema';
import type { ContactFormState } from '@/sections/contact/contact.types';
import type { ContactMessage, MailResult } from '@/server/mail/mail.types';

export type ContactDeps = Readonly<{
  ip: string;
  now: number;
  takeToken: (ip: string) => boolean;
  send: (message: ContactMessage) => Promise<MailResult>;
}>;

export const handleContact = async (
  formData: FormData,
  deps: ContactDeps,
): Promise<ContactFormState> => {
  if (!deps.takeToken(deps.ip)) {
    return { status: 'error', code: 'RATE_LIMITED', fieldErrors: null };
  }

  const raw: RawContactForm = readContactForm(formData);

  if (isBotSubmission(raw, deps.now)) {
    return { status: 'sent' };
  }

  const parsed = contactSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: 'error', code: 'INVALID_INPUT', fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { name, email, message } = parsed.data;
  const result: MailResult = await deps.send({ name, email, message });

  return result.ok
    ? { status: 'sent' }
    : { status: 'error', code: 'SEND_FAILED', fieldErrors: null };
};
