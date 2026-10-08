import 'server-only';

import { createTransport } from 'nodemailer';
import { z } from 'zod';

import { getServerEnv } from '@/core/config/server-env';
import { AUTO_REPLY_COPY, autoReplyHtml, autoReplyText } from '@/server/mail/auto-reply';
import {
  AUTO_REPLY_FAILED_LOG,
  CONTACT_SUBJECT_PREFIX,
  MAIL_FAILED_LOG,
  SMTPS_PORT,
  SMTP_TIMEOUTS_MS,
  SUBJECT_NAME_MAX,
  UNKNOWN_MAIL_ERROR,
} from '@/server/mail/mail.constants';

import type { SMTPTransportOptions } from 'nodemailer/lib/smtp-transport';
import type { ServerEnv } from '@/core/config/server-env';
import type {
  AutoReplier,
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
    connectionTimeout: SMTP_TIMEOUTS_MS.connection,
    greetingTimeout: SMTP_TIMEOUTS_MS.greeting,
    socketTimeout: SMTP_TIMEOUTS_MS.socket,
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

export const buildAutoReplyMail = (
  visitorEmail: string,
  env: Pick<ServerEnv, 'CONTACT_FROM' | 'CONTACT_TO'>,
): OutgoingMail => {
  return {
    from: env.CONTACT_FROM,
    to: visitorEmail,
    replyTo: env.CONTACT_TO,
    subject: AUTO_REPLY_COPY.subject,
    text: autoReplyText(AUTO_REPLY_COPY),
    html: autoReplyHtml(AUTO_REPLY_COPY),
  };
};

export const createAutoReplier = (transport: MailTransport, env: ServerEnv): AutoReplier => {
  return async (visitorEmail: string): Promise<MailResult> => {
    try {
      await transport.sendMail(buildAutoReplyMail(visitorEmail, env));

      return { ok: true };
    } catch (error) {
      console.error(AUTO_REPLY_FAILED_LOG, errorCodeOf(error));

      return { ok: false, code: 'SEND_FAILED' };
    }
  };
};

type Mailers = Readonly<{ contact: ContactMailer; autoReply: AutoReplier }>;

let mailers: Mailers | null = null;

const sharedMailers = (): Mailers => {
  if (mailers === null) {
    const env: ServerEnv = getServerEnv();
    const transport: MailTransport = createTransport(transportOptions(env));

    mailers = {
      contact: createContactMailer(transport, env),
      autoReply: createAutoReplier(transport, env),
    };
  }

  return mailers;
};

export const sendContactMail = (message: ContactMessage): Promise<MailResult> => {
  return sharedMailers().contact(message);
};

export const sendAutoReply = (visitorEmail: string): Promise<MailResult> => {
  return sharedMailers().autoReply(visitorEmail);
};
