import 'server-only';

import type { AutoReplyCopy } from '@/server/mail/mail.types';

export const AUTO_REPLY_COPY: AutoReplyCopy = {
  subject: 'Thanks, I got your message',
  heading: 'Message received',
  greeting: 'Hi,',
  body: "Thanks for writing. Your message is in my inbox, and I'll reply to this address soon. If you want to add something, just reply to this email.",
  name: 'Vitalii Vorynka',
  role: 'Full-stack Developer · AI Engineer',
  siteLabel: 'vorynka.dev',
  siteUrl: 'https://vorynka.dev',
};

const COLORS = {
  page: '#070a12',
  text: '#e4e8f0',
  muted: '#a5adbf',
  accent: '#ffaa00',
} as const;

const FONT_STACK = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const autoReplyText = (copy: AutoReplyCopy): string => {
  return [copy.greeting, '', copy.body, '', copy.name, copy.role, copy.siteLabel].join('\n');
};

export const autoReplyHtml = (copy: AutoReplyCopy): string => {
  return [
    '<!doctype html>',
    '<html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="dark"><title>',
    copy.heading,
    '</title></head>',
    `<body style="margin:0;padding:0;background:${COLORS.page};">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.page};">`,
    '<tr><td align="center" style="padding:32px 16px;">',
    `<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:${COLORS.page};border:1px solid #1b2133;">`,
    `<tr><td style="padding:32px 32px 8px 32px;font-family:${FONT_STACK};font-size:24px;line-height:32px;font-weight:700;color:${COLORS.text};">`,
    copy.heading,
    '</td></tr>',
    `<tr><td style="padding:8px 32px 24px 32px;font-family:${FONT_STACK};font-size:16px;line-height:26px;color:${COLORS.text};">`,
    copy.greeting,
    '<br><br>',
    copy.body,
    '</td></tr>',
    `<tr><td style="padding:0 32px 20px 32px;"><table role="presentation" width="48" cellpadding="0" cellspacing="0" border="0"><tr><td height="2" style="height:2px;line-height:2px;font-size:0;background:${COLORS.accent};">&nbsp;</td></tr></table></td></tr>`,
    `<tr><td style="padding:0 32px 32px 32px;font-family:${FONT_STACK};font-size:14px;line-height:22px;color:${COLORS.muted};">`,
    `<span style="color:${COLORS.text};font-weight:700;">${copy.name}</span><br>`,
    `${copy.role}<br>`,
    `<a href="${copy.siteUrl}" style="color:${COLORS.accent};text-decoration:none;">${copy.siteLabel}</a>`,
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>',
  ].join('');
};
