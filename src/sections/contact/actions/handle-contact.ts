import 'server-only';

import { isBotSubmission } from '@/sections/contact/actions/anti-bot';
import { contactSchema, fieldErrorsOf, readContactForm } from '@/sections/contact/contact.schema';

import { TURNSTILE_ACTION, TURNSTILE_FIELD } from '@/sections/contact/contact.types';

import type { RawContactForm } from '@/sections/contact/contact.schema';
import type { ContactFormState } from '@/sections/contact/contact.types';
import type { ContactMessage, MailResult } from '@/server/mail/mail.types';
import type { TurnstileResult, TurnstileVerifier } from '@/server/turnstile/turnstile.types';

export type ContactDeps = Readonly<{
  ip: string;
  now: number;
  takeToken: (ip: string) => boolean;
  verify: TurnstileVerifier;
  send: (message: ContactMessage) => Promise<MailResult>;
}>;

const turnstileToken = (formData: FormData): string => {
  const value: FormDataEntryValue | null = formData.get(TURNSTILE_FIELD);

  return typeof value === 'string' ? value : '';
};

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

  const verdict: TurnstileResult = await deps.verify({
    token: turnstileToken(formData),
    ip: deps.ip,
    action: TURNSTILE_ACTION,
  });

  if (!verdict.ok) {
    return { status: 'error', code: 'VERIFICATION_FAILED', fieldErrors: null };
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
