import { expect, vi } from 'vitest';

import { caseTest } from '@tests/back/sections/contact/handle-contact.case-test';
import { handleContact } from '@/sections/contact/actions/handle-contact';
import { createLimiter } from '@/server/rate-limit/rate-limit';
import { CONTACT_IP_POLICY } from '@/server/rate-limit/rate-limit.constants';

import type { ContactDeps } from '@/sections/contact/actions/handle-contact';
import type { ContactFormState } from '@/sections/contact/contact.types';
import type { ContactMessage, MailResult, OutgoingMail } from '@/server/mail/mail.types';

const NOW = 1_760_000_000_000;
const IP = '203.0.113.7';

const VALID_FIELDS: Readonly<Record<string, string>> = {
  name: '  Ann Lee ',
  email: ' ann@example.test ',
  message: '  Hello, let us talk about a role.  ',
  website: '',
  startedAt: String(NOW - 60_000),
};

type Harness = {
  deps: ContactDeps;
  outbox: ContactMessage[];
  takeToken: ReturnType<typeof vi.fn<(ip: string) => boolean>>;
};

const formOf = (overrides: Readonly<Record<string, string>> = {}): FormData => {
  const formData = new FormData();

  for (const [name, value] of Object.entries({ ...VALID_FIELDS, ...overrides })) {
    formData.set(name, value);
  }

  return formData;
};

const harness = (allow: (ip: string) => boolean, result: MailResult = { ok: true }): Harness => {
  const outbox: ContactMessage[] = [];
  const takeToken = vi.fn(allow);

  return {
    outbox,
    takeToken,
    deps: {
      ip: IP,
      now: NOW,
      takeToken,
      send: async (message: ContactMessage) => {
        outbox.push(message);

        return result;
      },
    },
  };
};

const always = (): boolean => {
  return true;
};

caseTest('sec.contact.limiter-first', 'nothing runs after an empty bucket', async () => {
  const { deps, outbox } = harness(() => {
    return false;
  });

  const formData: FormData = formOf();
  const read = vi.spyOn(formData, 'get');

  expect(await handleContact(formData, deps)).toEqual({
    status: 'error',
    code: 'RATE_LIMITED',
    fieldErrors: null,
  });

  expect(read).not.toHaveBeenCalled();
  expect(outbox).toEqual([]);
});

caseTest('sec.contact.limiter-key', 'one token per submission, keyed by IP', async () => {
  const { deps, takeToken } = harness(always);

  await handleContact(formOf(), deps);

  expect(takeToken.mock.calls).toEqual([[IP]]);
});

caseTest('sec.contact.burst', 'the fourth invalid submission is rate limited', async () => {
  const limiter = createLimiter(CONTACT_IP_POLICY, () => {
    return NOW;
  });

  const { deps, outbox } = harness(limiter.take);
  const codes: string[] = [];

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const state: ContactFormState = await handleContact(formOf({ email: 'nope' }), deps);

    codes.push(state.status === 'error' ? state.code : state.status);
  }

  expect(codes).toEqual(['INVALID_INPUT', 'INVALID_INPUT', 'INVALID_INPUT', 'RATE_LIMITED']);
  expect(outbox).toEqual([]);
});

caseTest('sec.contact.honeypot', 'silent success, no mail', async () => {
  const { deps, outbox } = harness(always);

  expect(await handleContact(formOf({ website: 'https://spam.test' }), deps)).toEqual({
    status: 'sent',
  });

  expect(outbox).toEqual([]);
});

caseTest('sec.contact.too-fast', 'silent success, no mail', async () => {
  const { deps, outbox } = harness(always);

  expect(await handleContact(formOf({ startedAt: String(NOW - 1000) }), deps)).toEqual({
    status: 'sent',
  });

  expect(outbox).toEqual([]);
});

caseTest('sec.contact.bot-before-zod', 'bots never see field errors', async () => {
  const { deps, outbox } = harness(always);

  expect(await handleContact(formOf({ name: '', email: 'nope', website: 'spam' }), deps)).toEqual({
    status: 'sent',
  });

  expect(outbox).toEqual([]);
});

caseTest('sec.contact.invalid', 'field errors, no mail', async () => {
  const { deps, outbox } = harness(always);

  expect(await handleContact(formOf({ name: '  ', email: 'nope' }), deps)).toEqual({
    status: 'error',
    code: 'INVALID_INPUT',
    fieldErrors: {
      name: 'Enter your name.',
      email: 'Enter a valid email, like name@company.com.',
    },
  });

  expect(outbox).toEqual([]);
});

caseTest('sec.contact.valid', 'exactly one message', async () => {
  const { deps, outbox } = harness(always);

  expect(await handleContact(formOf(), deps)).toEqual({ status: 'sent' });

  expect(outbox).toEqual([
    {
      name: 'Ann Lee',
      email: 'ann@example.test',
      message: 'Hello, let us talk about a role.',
    },
  ]);
});

caseTest('sec.contact.no-js', 'no startedAt still sends', async () => {
  const { deps, outbox } = harness(always);

  expect(await handleContact(formOf({ startedAt: '' }), deps)).toEqual({ status: 'sent' });
  expect(outbox).toHaveLength(1);
});

caseTest('sec.contact.send-failed', 'only the code reaches the state', async () => {
  const { deps, outbox } = harness(always, { ok: false, code: 'SEND_FAILED' });

  expect(await handleContact(formOf(), deps)).toEqual({
    status: 'error',
    code: 'SEND_FAILED',
    fieldErrors: null,
  });

  expect(outbox).toHaveLength(1);
});

caseTest(
  'sec.contact.action-wiring',
  'header IP, wall clock, real limiter and mailer',
  async () => {
    const sent: OutgoingMail[] = [];
    let clientIp = '198.51.100.20';

    vi.doMock('next/headers', () => {
      return {
        headers: async () => {
          return new Headers({ 'x-test-client-ip': clientIp, 'x-forwarded-for': '192.0.2.1' });
        },
      };
    });

    vi.doMock('nodemailer', () => {
      return {
        createTransport: () => {
          return {
            sendMail: async (mail: OutgoingMail) => {
              sent.push(mail);

              return { messageId: 'fake' };
            },
          };
        },
      };
    });

    const { sendMessageAction } = await import('@/sections/contact/actions/send-message.action');
    const statuses: string[] = [];

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const state: ContactFormState = await sendMessageAction(
        { status: 'idle' },
        formOf({ startedAt: String(Date.now() - 60_000) }),
      );

      statuses.push(state.status === 'error' ? state.code : state.status);
    }

    expect(statuses).toEqual(['sent', 'sent', 'sent', 'RATE_LIMITED']);
    expect(sent).toHaveLength(3);
    expect(sent[0]?.replyTo).toBe('ann@example.test');

    clientIp = '198.51.100.21';

    expect(await sendMessageAction({ status: 'idle' }, formOf({ startedAt: '' }))).toEqual({
      status: 'sent',
    });

    expect(sent).toHaveLength(4);

    vi.doUnmock('next/headers');
    vi.doUnmock('nodemailer');
  },
);
