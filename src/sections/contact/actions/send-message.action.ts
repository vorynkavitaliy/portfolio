'use server';

import 'server-only';

import { headers } from 'next/headers';
import { after } from 'next/server';

import { getServerEnv } from '@/core/config/server-env';
import { handleContact } from '@/sections/contact/actions/handle-contact';
import { sendAutoReply, sendContactMail } from '@/server/mail/mail';
import { takeContactToken } from '@/server/rate-limit/rate-limit';
import { clientIp } from '@/server/request/client-ip';
import { verifyTurnstile } from '@/server/turnstile/turnstile';

import type { ContactFormState } from '@/sections/contact/contact.types';

export const sendMessageAction = async (
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> => {
  const ip: string = clientIp(await headers(), getServerEnv().CLIENT_IP_HEADER);

  return handleContact(formData, {
    ip,
    now: Date.now(),
    takeToken: takeContactToken,
    verify: verifyTurnstile,
    send: sendContactMail,
    autoReply: sendAutoReply,
    defer: after,
  });
};
