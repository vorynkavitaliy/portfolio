import 'server-only';

export type ContactMessage = Readonly<{ name: string; email: string; message: string }>;

export type MailResult = { ok: true } | { ok: false; code: 'SEND_FAILED' };

export type OutgoingMail = Readonly<{
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html?: string;
}>;

export type MailTransport = Readonly<{ sendMail: (mail: OutgoingMail) => Promise<unknown> }>;

export type ContactMailer = (message: ContactMessage) => Promise<MailResult>;

export type AutoReplyCopy = Readonly<{
  subject: string;
  heading: string;
  greeting: string;
  body: string;
  name: string;
  role: string;
  siteLabel: string;
  siteUrl: string;
}>;

export type AutoReplier = (visitorEmail: string) => Promise<MailResult>;
