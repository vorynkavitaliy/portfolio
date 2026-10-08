import { expect, vi } from 'vitest';

import { caseTest } from '@tests/back/server/mail/mail.case-test';
import {
  buildAutoReplyMail,
  buildContactMail,
  createAutoReplier,
  createContactMailer,
  transportOptions,
} from '@/server/mail/mail';

import type { ServerEnv } from '@/core/config/server-env';
import type { ContactMessage, MailTransport, OutgoingMail } from '@/server/mail/mail.types';

const ENV: ServerEnv = {
  SMTP_HOST: 'smtp.example.test',
  SMTP_PORT: 587,
  SMTP_USER: 'mailer-user',
  SMTP_PASS: 'mailer-pass-k29x',
  CONTACT_FROM: 'site@example.test',
  CONTACT_TO: 'owner@example.test',
  CLIENT_IP_HEADER: 'x-real-ip',
};

const MESSAGE: ContactMessage = {
  name: 'Ann Lee',
  email: 'ann@example.test',
  message: 'Hello Vitalii,\nlet us talk about a role.',
};

type Outbox = { transport: MailTransport; sent: OutgoingMail[] };

const fakeOutbox = (): Outbox => {
  const sent: OutgoingMail[] = [];

  return {
    sent,
    transport: {
      sendMail: async (mail: OutgoingMail) => {
        sent.push(mail);

        return { messageId: 'fake' };
      },
    },
  };
};

const failingTransport = (error: unknown): MailTransport => {
  return {
    sendMail: async () => {
      throw error;
    },
  };
};

const hostOptions = (host: string, port: number): ReturnType<typeof transportOptions> => {
  return transportOptions({ ...ENV, SMTP_HOST: host, SMTP_PORT: port });
};

caseTest('sec.mail.from-to-fixed', 'from and to come from env', () => {
  const mail: OutgoingMail = buildContactMail(
    { ...MESSAGE, email: 'owner@example.test' },
    { CONTACT_FROM: ENV.CONTACT_FROM, CONTACT_TO: ENV.CONTACT_TO },
  );

  expect(mail.from).toBe('site@example.test');
  expect(mail.to).toBe('owner@example.test');

  const other: OutgoingMail = buildContactMail(MESSAGE, ENV);

  expect(other.from).toBe('site@example.test');
  expect(other.to).toBe('owner@example.test');
});

caseTest('sec.mail.reply-to', 'the visitor is only the reply address', () => {
  const mail: OutgoingMail = buildContactMail(MESSAGE, ENV);

  expect(mail.replyTo).toBe('ann@example.test');
  expect(mail.from).not.toContain('ann@example.test');
  expect(mail.to).not.toContain('ann@example.test');
});

caseTest('sec.mail.subject', 'fixed prefix and the name', () => {
  expect(buildContactMail(MESSAGE, ENV).subject).toBe('Portfolio contact: Ann Lee');
});

caseTest('sec.mail.subject.single-line', 'CR and LF never reach the subject', () => {
  const subject: string = buildContactMail(
    { ...MESSAGE, name: 'Ann\r\nBcc: x@evil.test' },
    ENV,
  ).subject;

  expect(subject).toBe('Portfolio contact: AnnBcc: x@evil.test');
  expect(subject).not.toMatch(/[\r\n]/);
});

caseTest('sec.mail.subject.length', 'the name part is cut at 80', () => {
  const name: string = 'A'.repeat(120);

  expect(buildContactMail({ ...MESSAGE, name }, ENV).subject).toBe(
    `Portfolio contact: ${'A'.repeat(80)}`,
  );
});

caseTest('sec.mail.text', 'name, email, blank line, message', () => {
  expect(buildContactMail(MESSAGE, ENV).text).toBe(
    'Name: Ann Lee\nEmail: ann@example.test\n\nHello Vitalii,\nlet us talk about a role.',
  );
});

caseTest('sec.mail.no-html', 'text body only', async () => {
  const outbox: Outbox = fakeOutbox();

  await createContactMailer(outbox.transport, ENV)(MESSAGE);

  expect(Object.keys(buildContactMail(MESSAGE, ENV)).sort()).toEqual([
    'from',
    'replyTo',
    'subject',
    'text',
    'to',
  ]);

  expect(outbox.sent).toHaveLength(1);
  expect(outbox.sent[0]).not.toHaveProperty('html');
});

caseTest('sec.mail.sent-once', 'one transport call, ok result', async () => {
  const outbox: Outbox = fakeOutbox();

  const result = await createContactMailer(outbox.transport, ENV)(MESSAGE);

  expect(result).toEqual({ ok: true });

  expect(outbox.sent).toEqual([
    {
      from: 'site@example.test',
      to: 'owner@example.test',
      replyTo: 'ann@example.test',
      subject: 'Portfolio contact: Ann Lee',
      text: 'Name: Ann Lee\nEmail: ann@example.test\n\nHello Vitalii,\nlet us talk about a role.',
    },
  ]);
});

caseTest('sec.mail.failure-code', 'the code is logged, SEND_FAILED returned', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {
    return undefined;
  });

  const error = Object.assign(new Error('Invalid login: 535 5.7.8 rejected'), { code: 'EAUTH' });
  const result = await createContactMailer(failingTransport(error), ENV)(MESSAGE);

  expect(result).toEqual({ ok: false, code: 'SEND_FAILED' });
  expect(log.mock.calls).toEqual([['contact.mail.failed', 'EAUTH']]);
});

caseTest('sec.mail.failure-no-text', 'no provider text, secret or visitor data leaks', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {
    return undefined;
  });

  const providerText = `535 auth failed for mailer-user with ${ENV.SMTP_PASS}`;
  const error = Object.assign(new Error(providerText), { code: 'EAUTH', response: providerText });
  const result = await createContactMailer(failingTransport(error), ENV)(MESSAGE);
  const leaked: string = JSON.stringify([result, log.mock.calls]);

  expect(leaked).not.toContain('535');
  expect(leaked).not.toContain(ENV.SMTP_PASS);
  expect(leaked).not.toContain(MESSAGE.email);
  expect(leaked).not.toContain('let us talk');
  expect(result).toEqual({ ok: false, code: 'SEND_FAILED' });
});

caseTest('sec.mail.failure-unknown', 'anything without a code shape is UNKNOWN', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {
    return undefined;
  });

  const thrown: readonly unknown[] = [
    new Error('socket hang up'),
    'connection refused by smtp.example.test',
    { code: 'connect failed: host smtp.example.test said no' },
  ];

  for (const error of thrown) {
    expect(await createContactMailer(failingTransport(error), ENV)(MESSAGE)).toEqual({
      ok: false,
      code: 'SEND_FAILED',
    });
  }

  expect(log.mock.calls).toEqual([
    ['contact.mail.failed', 'UNKNOWN'],
    ['contact.mail.failed', 'UNKNOWN'],
    ['contact.mail.failed', 'UNKNOWN'],
  ]);
});

caseTest('sec.mail.tls.smtps', '465 is implicit TLS', () => {
  expect(hostOptions('smtp.example.test', 465).secure).toBe(true);
});

caseTest('sec.mail.tls.submission', 'remote non-465 ports require STARTTLS', () => {
  for (const port of [587, 25]) {
    const options = hostOptions('smtp.example.test', port);

    expect(options.secure).toBe(false);
    expect(options.requireTLS).toBe(true);
  }
});

caseTest('sec.mail.tls.loopback', 'Mailpit on loopback is plain', () => {
  for (const host of ['127.0.0.1', 'localhost']) {
    const options = hostOptions(host, 1025);

    expect(options.secure).toBe(false);
    expect(options.requireTLS).toBe(false);
  }
});

caseTest('sec.mail.tls.loopback-lookalike', 'loopback-looking names still need TLS', () => {
  for (const host of ['127.0.0.1.evil.test', 'localhost.evil.test']) {
    expect(hostOptions(host, 587).requireTLS).toBe(true);
  }
});

caseTest('sec.mail.tls.min-version', 'TLS 1.2 minimum, verification untouched', () => {
  expect(hostOptions('smtp.example.test', 587).tls).toEqual({ minVersion: 'TLSv1.2' });
  expect(hostOptions('127.0.0.1', 1025).tls).toEqual({ minVersion: 'TLSv1.2' });
});

caseTest('sec.mail.timeouts', 'a blocked SMTP port fails fast', () => {
  const options = transportOptions(ENV);

  expect([options.connectionTimeout, options.greetingTimeout, options.socketTimeout]).toEqual([
    10000, 10000, 20000,
  ]);
});

caseTest('sec.mail.auth-and-host', 'host, port and credentials from env', () => {
  const options = transportOptions(ENV);

  expect(options.host).toBe('smtp.example.test');
  expect(options.port).toBe(587);
  expect(options.auth).toEqual({ user: 'mailer-user', pass: 'mailer-pass-k29x' });
});

caseTest(
  'sec.mail.transport.lazy-once',
  'one transport per instance, created on first send',
  async () => {
    const outbox: Outbox = fakeOutbox();

    const createTransport = vi.fn(() => {
      return outbox.transport;
    });

    vi.doMock('nodemailer', () => {
      return { createTransport };
    });

    const mail = await import('@/server/mail/mail');

    expect(createTransport).not.toHaveBeenCalled();

    expect(await mail.sendContactMail(MESSAGE)).toEqual({ ok: true });
    expect(await mail.sendContactMail(MESSAGE)).toEqual({ ok: true });

    expect(createTransport.mock.calls).toEqual([
      [
        {
          host: 'smtp.test.invalid',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: { user: 'test-user', pass: 'test-pass-not-real' },
          tls: { minVersion: 'TLSv1.2' },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
        },
      ],
    ]);

    expect(outbox.sent).toHaveLength(2);
    expect(outbox.sent[0]?.to).toBe('owner@test.invalid');

    vi.doUnmock('nodemailer');
  },
);

const HOSTILE: ContactMessage = {
  name: 'Buy pills at evil.test',
  email: 'victim@example.test',
  message: 'Cheap pills http://evil.test/buy?x=1\r\nBcc: spam@evil.test',
};

const withoutTo = (mail: OutgoingMail): Omit<OutgoingMail, 'to'> => {
  const { to: _to, ...rest } = mail;

  return rest;
};

caseTest(
  'sec.mail.autoreply.envelope',
  'fixed from, replyTo and subject, visitor in to',
  async () => {
    const outbox: Outbox = fakeOutbox();

    expect(await createAutoReplier(outbox.transport, ENV)('ann@example.test')).toEqual({
      ok: true,
    });

    expect(outbox.sent).toHaveLength(1);

    const mail = outbox.sent[0];

    expect(mail?.from).toBe('site@example.test');
    expect(mail?.to).toBe('ann@example.test');
    expect(mail?.replyTo).toBe('owner@example.test');
    expect(mail?.subject).toBe('Thanks, I got your message');
  },
);

caseTest('sec.mail.autoreply.no-visitor-text', 'nothing the visitor typed is relayed', () => {
  const hostile: OutgoingMail = buildAutoReplyMail(HOSTILE.email, ENV);
  const other: OutgoingMail = buildAutoReplyMail('someone@example.test', ENV);

  expect(withoutTo(hostile)).toEqual(withoutTo(other));
  expect(hostile.to).toBe('victim@example.test');

  const rest: string = JSON.stringify(withoutTo(hostile));

  for (const typed of [HOSTILE.name, HOSTILE.message, 'evil.test', 'victim', 'pills', 'Bcc']) {
    expect(rest).not.toContain(typed);
  }

  expect(Object.keys(hostile).sort()).toEqual(['from', 'html', 'replyTo', 'subject', 'text', 'to']);
});

caseTest('sec.mail.autoreply.body', 'copy and an email-safe html', () => {
  const mail: OutgoingMail = buildAutoReplyMail('ann@example.test', ENV);

  expect(mail.text).toBe(
    "Hi,\n\nThanks for writing. Your message is in my inbox, and I'll reply to this address soon. If you want to add something, just reply to this email.\n\nVitalii Vorynka\nFull-stack Developer · AI Engineer\nvorynka.dev",
  );

  const html: string = mail.html ?? '';

  for (const part of [
    'Message received',
    "Thanks for writing. Your message is in my inbox, and I'll reply to this address soon. If you want to add something, just reply to this email.",
    'Vitalii Vorynka',
    'Full-stack Developer · AI Engineer',
    'href="https://vorynka.dev"',
    '#070a12',
    '#e4e8f0',
    '#a5adbf',
    '#ffaa00',
    '<table',
    'style="',
  ]) {
    expect(html).toContain(part);
  }

  expect(html).not.toMatch(/<img|<link|<script|<style|@import|url\(|@font-face/i);
  expect(html.match(/https?:\/\/[^"'\s<)]+/g)).toEqual(['https://vorynka.dev']);
  expect(mail.text + html).not.toContain('—');
});

caseTest('sec.mail.autoreply.failure', 'only the code is logged', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {
    return undefined;
  });

  const providerText = '550 rejected victim@example.test';
  const error = Object.assign(new Error(providerText), { code: 'EAUTH', response: providerText });

  expect(await createAutoReplier(failingTransport(error), ENV)('victim@example.test')).toEqual({
    ok: false,
    code: 'SEND_FAILED',
  });

  expect(log.mock.calls).toEqual([['contact.autoreply.failed', 'EAUTH']]);
});

caseTest('sec.mail.autoreply.shared-transport', 'one transport for both mails', async () => {
  const outbox: Outbox = fakeOutbox();

  const createTransport = vi.fn(() => {
    return outbox.transport;
  });

  vi.resetModules();

  vi.doMock('nodemailer', () => {
    return { createTransport };
  });

  const mail = await import('@/server/mail/mail');

  expect(await mail.sendContactMail(MESSAGE)).toEqual({ ok: true });
  expect(await mail.sendAutoReply(MESSAGE.email)).toEqual({ ok: true });

  expect(createTransport).toHaveBeenCalledTimes(1);

  expect(
    outbox.sent.map((sent) => {
      return sent.to;
    }),
  ).toEqual(['owner@test.invalid', 'ann@example.test']);

  vi.doUnmock('nodemailer');
});
