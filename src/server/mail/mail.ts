import 'server-only';

import { createTransport } from 'nodemailer';
import { z } from 'zod';

import { getServerEnv } from '@/core/config/server-env';
import {
  CONTACT_SUBJECT_PREFIX,
  MAIL_FAILED_LOG,
  SMTPS_PORT,
  SUBJECT_NAME_MAX,
  UNKNOWN_MAIL_ERROR,
} from '@/server/mail/mail.constants';

import type { SMTPTransportOptions } from 'nodemailer/lib/smtp-transport';
import type { ServerEnv } from '@/core/config/server-env';
import type {
  ContactMailer,
  ContactMessage,
  MailResult,
  MailTransport,
  OutgoingMail,
} from '@/server/mail/mail.types';

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;

const LOOPBACK_HOST = /^(localhost|::1|127(\.\d{1,3}){3})$/;

const providerError = z.object({ code: z.string().regex(/^[A-Z0-9_]{1,32}$/) });

const singleLine = (value: string): string => {
  return value.replace(CONTROL_CHARACTERS, '').trim().slice(0, SUBJECT_NAME_MAX);
};

const errorCodeOf = (error: unknown): string => {
  const parsed = providerError.safeParse(error);

  return parsed.success ? parsed.data.code : UNKNOWN_MAIL_ERROR;
};

export const buildContactMail = (
  message: ContactMessage,
  env: Pick<ServerEnv, 'CONTACT_FROM' | 'CONTACT_TO'>,
): OutgoingMail => {
  return {
    from: env.CONTACT_FROM,
    to: env.CONTACT_TO,
    replyTo: message.email,
    subject: `${CONTACT_SUBJECT_PREFIX} ${singleLine(message.name)}`,
    text: `Name: ${message.name}\nEmail: ${message.email}\n\n${message.message}`,
  };
};

export const transportOptions = (env: ServerEnv): SMTPTransportOptions => {
  const secure: boolean = env.SMTP_PORT === SMTPS_PORT;

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure,
    requireTLS: !secure && !LOOPBACK_HOST.test(env.SMTP_HOST),
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    tls: { minVersion: 'TLSv1.2' },
  };
};

export const createContactMailer = (transport: MailTransport, env: ServerEnv): ContactMailer => {
  return async (message: ContactMessage): Promise<MailResult> => {
    try {
      await transport.sendMail(buildContactMail(message, env));

      return { ok: true };
    } catch (error) {
      console.error(MAIL_FAILED_LOG, errorCodeOf(error));

      return { ok: false, code: 'SEND_FAILED' };
    }
  };
};

let contactMailer: ContactMailer | null = null;

export const sendContactMail = (message: ContactMessage): Promise<MailResult> => {
  if (contactMailer === null) {
    const env: ServerEnv = getServerEnv();

    contactMailer = createContactMailer(createTransport(transportOptions(env)), env);
  }

  return contactMailer(message);
};
