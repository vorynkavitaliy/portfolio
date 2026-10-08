import { expect, vi } from 'vitest';

import { caseTest } from '@tests/back/sections/contact/handle-contact.case-test';
import { handleContact } from '@/sections/contact/actions/handle-contact';
import { createLimiter } from '@/server/rate-limit/rate-limit';
import { CONTACT_IP_POLICY } from '@/server/rate-limit/rate-limit.constants';

import type { ContactDeps } from '@/sections/contact/actions/handle-contact';
import type { ContactFormState } from '@/sections/contact/contact.types';
import type { ContactMessage, MailResult, OutgoingMail } from '@/server/mail/mail.types';
import type {
  TurnstileFailure,
  TurnstileRequest,
  TurnstileResult,
} from '@/server/turnstile/turnstile.types';

const NOW = 1_760_000_000_000;
const IP = '203.0.113.7';
const CAPTCHA_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';
const SECRET = '0x4AAAAAAA-wiring-secret';

const VALID_FIELDS: Readonly<Record<string, string>> = {
  name: '  Ann Lee ',
  email: ' ann@example.test ',
  message: '  Hello, let us talk about a role.  ',
  website: '',
  startedAt: String(NOW - 60_000),
  'cf-turnstile-response': CAPTCHA_TOKEN,
};

type Harness = {
  deps: ContactDeps;
  outbox: ContactMessage[];
  replies: string[][];
  checks: TurnstileRequest[];
  takeToken: ReturnType<typeof vi.fn<(ip: string) => boolean>>;
};

const formOf = (overrides: Readonly<Record<string, string>> = {}): FormData => {
  const formData = new FormData();

  for (const [name, value] of Object.entries({ ...VALID_FIELDS, ...overrides })) {
    formData.set(name, value);
  }

  return formData;
};

const harness = (
  allow: (ip: string) => boolean,
  result: MailResult = { ok: true },
  verdict: TurnstileResult = { ok: true },
  replyResult: MailResult = { ok: true },
): Harness => {
  const outbox: ContactMessage[] = [];
  const replies: string[][] = [];
  const checks: TurnstileRequest[] = [];
  const takeToken = vi.fn(allow);

  return {
    outbox,
    replies,
    checks,
    takeToken,
    deps: {
      ip: IP,
      now: NOW,
      takeToken,
      verify: async (request: TurnstileRequest) => {
        checks.push(request);

        return verdict;
      },
      send: async (message: ContactMessage) => {
        outbox.push(message);

        return result;
      },
      defer: (task: () => Promise<unknown>) => {
        void task();
      },
      autoReply: async (...args: string[]) => {
        replies.push(args);

        return replyResult;
      },
    },
  };
};

const always = (): boolean => {
  return true;
};

caseTest('sec.contact.limiter-first', 'nothing runs after an empty bucket', async () => {
  const { deps, outbox, checks } = harness(() => {
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
  expect(checks).toEqual([]);
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

caseTest('sec.contact.no-js', 'no startedAt with a token still sends', async () => {
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

    const verifyBodies: Record<string, string>[] = [];
    let captchaPasses = true;

    vi.stubEnv('TURNSTILE_SECRET_KEY', SECRET);
    vi.stubEnv('SITE_URL', 'https://portfolio.example.test');
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      const body: unknown = init.body;

      verifyBodies.push(body instanceof URLSearchParams ? Object.fromEntries(body.entries()) : {});

      return Response.json({
        success: captchaPasses,
        hostname: 'portfolio.example.test',
        action: 'contact',
      });
    });

    let deferredTasks = 0;

    vi.doMock('next/server', () => {
      return {
        after: (task: () => Promise<unknown>) => {
          deferredTasks += 1;
          void task();
        },
      };
    });

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
    expect(sent).toHaveLength(6);

    expect(
      sent.map((mail) => {
        return mail.to;
      }),
    ).toEqual([
      'owner@test.invalid',
      'ann@example.test',
      'owner@test.invalid',
      'ann@example.test',
      'owner@test.invalid',
      'ann@example.test',
    ]);

    expect(sent[0]?.replyTo).toBe('ann@example.test');
    expect(verifyBodies).toHaveLength(3);

    for (const body of verifyBodies) {
      expect(body['secret']).toBe(SECRET);
      expect(body['response']).toBe(CAPTCHA_TOKEN);
      expect(body['remoteip']).toBe('198.51.100.20');
    }

    clientIp = '198.51.100.21';

    expect(await sendMessageAction({ status: 'idle' }, formOf({ startedAt: '' }))).toEqual({
      status: 'sent',
    });

    expect(sent).toHaveLength(8);

    clientIp = '198.51.100.22';
    captchaPasses = false;

    expect(await sendMessageAction({ status: 'idle' }, formOf())).toEqual({
      status: 'error',
      code: 'VERIFICATION_FAILED',
      fieldErrors: null,
    });

    expect(sent).toHaveLength(8);
    expect(deferredTasks).toBe(4);

    vi.unstubAllGlobals();
    vi.doUnmock('next/headers');
    vi.doUnmock('next/server');
    vi.doUnmock('nodemailer');
  },
);

const FAILURES: readonly TurnstileFailure[] = [
  'missing-token',
  'unavailable',
  'bad-response',
  'rejected',
  'hostname-mismatch',
  'action-mismatch',
];

const VERIFICATION_FAILED: ContactFormState = {
  status: 'error',
  code: 'VERIFICATION_FAILED',
  fieldErrors: null,
};

caseTest('sec.contact.turnstile-request', 'token, IP and action reach the check', async () => {
  const { deps, checks } = harness(always);

  await handleContact(formOf(), deps);

  const bare: FormData = formOf();

  bare.delete('cf-turnstile-response');
  await handleContact(bare, deps);

  expect(checks).toEqual([
    { token: CAPTCHA_TOKEN, ip: IP, action: 'contact' },
    { token: '', ip: IP, action: 'contact' },
  ]);
});

caseTest('sec.contact.turnstile-failed', 'every failure is VERIFICATION_FAILED', async () => {
  for (const code of FAILURES) {
    const { deps, outbox } = harness(always, { ok: true }, { ok: false, code });

    expect(await handleContact(formOf(), deps)).toEqual(VERIFICATION_FAILED);
    expect(outbox).toEqual([]);
  }
});

caseTest('sec.contact.turnstile-after-bot', 'bots never reach Turnstile', async () => {
  const { deps, checks, outbox } = harness(always);

  expect(await handleContact(formOf({ website: 'https://spam.test' }), deps)).toEqual({
    status: 'sent',
  });

  expect(await handleContact(formOf({ startedAt: String(NOW - 1000) }), deps)).toEqual({
    status: 'sent',
  });

  expect(checks).toEqual([]);
  expect(outbox).toEqual([]);
});

caseTest('sec.contact.turnstile-before-zod', 'no field errors before the check', async () => {
  const { deps, outbox } = harness(always, { ok: true }, { ok: false, code: 'rejected' });

  expect(await handleContact(formOf({ name: '', email: 'nope' }), deps)).toEqual(
    VERIFICATION_FAILED,
  );

  expect(outbox).toEqual([]);
});

caseTest('sec.contact.no-js-no-token', 'a plain POST without a token sends nothing', async () => {
  const { deps, outbox } = harness(always, { ok: true }, { ok: false, code: 'missing-token' });
  const bare: FormData = formOf({ startedAt: '' });

  bare.delete('cf-turnstile-response');

  expect(await handleContact(bare, deps)).toEqual(VERIFICATION_FAILED);
  expect(outbox).toEqual([]);
});

caseTest('sec.contact.autoreply-sent', 'once, after the owner mail, to the visitor', async () => {
  const { deps, outbox, replies } = harness(always);
  const order: string[] = [];

  const send = deps.send;
  const autoReply = deps.autoReply;

  expect(
    await handleContact(formOf(), {
      ...deps,
      send: async (message) => {
        order.push('owner');

        return send(message);
      },
      autoReply: async (email) => {
        order.push('reply');

        return autoReply(email);
      },
    }),
  ).toEqual({ status: 'sent' });

  expect(order).toEqual(['owner', 'reply']);
  expect(outbox).toHaveLength(1);
  expect(replies).toEqual([['ann@example.test']]);
});

caseTest('sec.contact.autoreply-no-visitor-text', 'only the address is passed on', async () => {
  const { deps, replies } = harness(always);

  await handleContact(
    formOf({
      name: 'Buy pills at evil.test',
      message: 'Cheap pills at http://evil.test/buy now, please click',
    }),
    deps,
  );

  expect(replies).toEqual([['ann@example.test']]);
});

caseTest(
  'sec.contact.autoreply-skipped',
  'only a real, delivered message is answered',
  async () => {
    const cases: readonly Readonly<{
      fields: Readonly<Record<string, string>>;
      allow: boolean;
      result: MailResult;
      verdict: TurnstileResult;
    }>[] = [
      {
        fields: { website: 'https://spam.test' },
        allow: true,
        result: { ok: true },
        verdict: { ok: true },
      },
      {
        fields: { startedAt: String(NOW - 1000) },
        allow: true,
        result: { ok: true },
        verdict: { ok: true },
      },
      { fields: {}, allow: false, result: { ok: true }, verdict: { ok: true } },
      { fields: {}, allow: true, result: { ok: true }, verdict: { ok: false, code: 'rejected' } },
      { fields: { email: 'nope' }, allow: true, result: { ok: true }, verdict: { ok: true } },
      {
        fields: {},
        allow: true,
        result: { ok: false, code: 'SEND_FAILED' },
        verdict: { ok: true },
      },
    ];

    for (const entry of cases) {
      const { deps, replies } = harness(
        () => {
          return entry.allow;
        },
        entry.result,
        entry.verdict,
      );

      await handleContact(formOf(entry.fields), deps);

      expect(replies).toEqual([]);
    }
  },
);

caseTest('sec.contact.autoreply-deferred', 'sent without waiting for the auto-reply', async () => {
  const { deps, replies } = harness(always);
  const tasks: Array<() => Promise<unknown>> = [];

  expect(
    await handleContact(formOf(), {
      ...deps,
      defer: (task) => {
        tasks.push(task);
      },
    }),
  ).toEqual({ status: 'sent' });

  expect(replies).toEqual([]);
  expect(tasks).toHaveLength(1);

  await tasks[0]?.();

  expect(replies).toEqual([['ann@example.test']]);
});

caseTest('sec.contact.autoreply-failed', 'the visitor still sees sent', async () => {
  const { deps, outbox, replies } = harness(
    always,
    { ok: true },
    { ok: true },
    { ok: false, code: 'SEND_FAILED' },
  );

  expect(await handleContact(formOf(), deps)).toEqual({ status: 'sent' });
  expect(outbox).toHaveLength(1);
  expect(replies).toHaveLength(1);
});
