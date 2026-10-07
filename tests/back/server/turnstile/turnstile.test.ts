import { afterEach, expect, vi } from 'vitest';

import { caseTest } from '@tests/back/server/turnstile/turnstile.case-test';
import { createTurnstileVerifier, verifyTurnstile } from '@/server/turnstile/turnstile';

import type { TurnstileConfig, TurnstileResult } from '@/server/turnstile/turnstile.types';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SECRET = '0x4AAAAAAA-real-looking-secret';
const TEST_PASS_SECRET = '1x0000000000000000000000000000000AA';
const HOST = 'portfolio.example.test';
const IP = '203.0.113.9';
const TOKEN = 'token-abc.def';
const REQUEST = { token: TOKEN, ip: IP, action: 'contact' } as const;

type Call = Readonly<{ url: string; init: RequestInit }>;

type FakeFetch = Readonly<{
  calls: Call[];
  fetch: (url: string, init: RequestInit) => Promise<Response>;
}>;

const jsonResponse = (body: unknown, status = 200): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
};

const fakeFetch = (answer: () => Promise<Response>): FakeFetch => {
  const calls: Call[] = [];

  return {
    calls,
    fetch: async (url: string, init: RequestInit) => {
      calls.push({ url, init });

      return answer();
    },
  };
};

const answering = (body: unknown, status = 200): FakeFetch => {
  return fakeFetch(async () => {
    return jsonResponse(body, status);
  });
};

const hanging = (): FakeFetch => {
  const calls: Call[] = [];

  return {
    calls,
    fetch: async (url: string, init: RequestInit) => {
      calls.push({ url, init });

      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      });
    },
  };
};

const PASS = { success: true, hostname: HOST, action: 'contact', 'error-codes': [] };

let keyCounter = 0;

const configWith = (fake: FakeFetch, overrides: Partial<TurnstileConfig> = {}): TurnstileConfig => {
  return {
    secret: SECRET,
    hostname: HOST,
    timeoutMs: 3000,
    fetch: fake.fetch,
    idempotencyKey: () => {
      keyCounter += 1;

      return `key-${keyCounter}`;
    },
    ...overrides,
  };
};

const verifyWith = (fake: FakeFetch, overrides: Partial<TurnstileConfig> = {}) => {
  return createTurnstileVerifier(configWith(fake, overrides));
};

const bodyOf = (call: Call | undefined): Record<string, string> => {
  const body: unknown = call?.init.body;

  return body instanceof URLSearchParams ? Object.fromEntries(body.entries()) : {};
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

caseTest('sec.turnstile.success', 'site hostname and action pass', async () => {
  const fake = answering(PASS);

  expect(await verifyWith(fake)(REQUEST)).toEqual({ ok: true });
  expect(fake.calls).toHaveLength(1);
  expect(fake.calls[0]?.url).toBe(SITEVERIFY);
  expect(fake.calls[0]?.init.method).toBe('POST');
});

caseTest('sec.turnstile.request-body', 'secret, response, remoteip, idempotency key', async () => {
  const fake = answering(PASS);
  const verify = verifyWith(fake);

  await verify(REQUEST);
  await verify({ ...REQUEST, ip: 'unknown' });

  const first = bodyOf(fake.calls[0]);
  const second = bodyOf(fake.calls[1]);

  expect(Object.keys(first).sort()).toEqual(['idempotency_key', 'remoteip', 'response', 'secret']);
  expect(first['secret']).toBe(SECRET);
  expect(first['response']).toBe(TOKEN);
  expect(first['remoteip']).toBe(IP);
  expect(first['idempotency_key']).toMatch(/^key-\d+$/);
  expect(Object.keys(second).sort()).toEqual(['idempotency_key', 'response', 'secret']);
  expect(second['idempotency_key']).not.toBe(first['idempotency_key']);
});

caseTest('sec.turnstile.missing-token', 'empty or oversized tokens never leave', async () => {
  const fake = answering(PASS);
  const verify = verifyWith(fake);

  expect(await verify({ ...REQUEST, token: '' })).toEqual({ ok: false, code: 'missing-token' });

  expect(await verify({ ...REQUEST, token: 'x'.repeat(2049) })).toEqual({
    ok: false,
    code: 'missing-token',
  });

  expect(fake.calls).toHaveLength(0);
  expect(await verify({ ...REQUEST, token: 'x'.repeat(2048) })).toEqual({ ok: true });
  expect(fake.calls).toHaveLength(1);
});

caseTest('sec.turnstile.rejected', 'only the code comes back', async () => {
  const fake = answering({ success: false, 'error-codes': ['invalid-input-response'] });

  expect(await verifyWith(fake)(REQUEST)).toEqual({ ok: false, code: 'rejected' });
});

caseTest('sec.turnstile.hostname-mismatch', 'another or no hostname fails', async () => {
  expect(await verifyWith(answering({ ...PASS, hostname: 'evil.example' }))(REQUEST)).toEqual({
    ok: false,
    code: 'hostname-mismatch',
  });

  expect(await verifyWith(answering({ success: true, action: 'contact' }))(REQUEST)).toEqual({
    ok: false,
    code: 'hostname-mismatch',
  });
});

caseTest('sec.turnstile.action-mismatch', 'another or no action fails', async () => {
  expect(await verifyWith(answering({ ...PASS, action: 'login' }))(REQUEST)).toEqual({
    ok: false,
    code: 'action-mismatch',
  });

  expect(await verifyWith(answering({ success: true, hostname: HOST }))(REQUEST)).toEqual({
    ok: false,
    code: 'action-mismatch',
  });
});

caseTest('sec.turnstile.test-secret', 'test secrets skip the binding checks only', async () => {
  const dummy = { success: true, hostname: 'example.com', action: '' };

  expect(await verifyWith(answering(dummy), { secret: TEST_PASS_SECRET })(REQUEST)).toEqual({
    ok: true,
  });

  expect(
    await verifyWith(answering({ success: false }), { secret: TEST_PASS_SECRET })(REQUEST),
  ).toEqual({ ok: false, code: 'rejected' });

  expect(await verifyWith(answering(dummy))(REQUEST)).toEqual({
    ok: false,
    code: 'hostname-mismatch',
  });
});

caseTest('sec.turnstile.timeout', 'pending at 2999 ms, unavailable at 3000 ms', async () => {
  vi.useFakeTimers();

  let settled: TurnstileResult | null = null;

  void verifyWith(hanging())(REQUEST).then((result: TurnstileResult) => {
    settled = result;
  });

  await vi.advanceTimersByTimeAsync(2999);
  expect(settled).toBeNull();
  await vi.advanceTimersByTimeAsync(1);
  expect(settled).toEqual({ ok: false, code: 'unavailable' });
});

caseTest('sec.turnstile.network-error', 'rejected fetch and HTTP 500', async () => {
  const offline = fakeFetch(async () => {
    throw new TypeError('fetch failed: getaddrinfo ENOTFOUND challenges.cloudflare.com');
  });

  expect(await verifyWith(offline)(REQUEST)).toEqual({ ok: false, code: 'unavailable' });

  expect(await verifyWith(answering(PASS, 500))(REQUEST)).toEqual({
    ok: false,
    code: 'unavailable',
  });
});

caseTest('sec.turnstile.bad-response', 'non-JSON and wrong shape', async () => {
  const html = fakeFetch(async () => {
    return new Response('<html>bad gateway</html>', { status: 200 });
  });

  expect(await verifyWith(html)(REQUEST)).toEqual({ ok: false, code: 'bad-response' });

  expect(await verifyWith(answering({ success: 'true', hostname: HOST }))(REQUEST)).toEqual({
    ok: false,
    code: 'bad-response',
  });
});

caseTest('sec.turnstile.wiring', 'env secret, SITE_URL host, 3 s timeout', async () => {
  vi.stubEnv('TURNSTILE_SECRET_KEY', SECRET);
  vi.stubEnv('SITE_URL', `https://${HOST}`);
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  const fake = answering(PASS);

  vi.stubGlobal('fetch', fake.fetch);

  expect(await verifyTurnstile(REQUEST)).toEqual({ ok: true });
  expect(bodyOf(fake.calls[0])['secret']).toBe(SECRET);

  vi.stubGlobal('fetch', answering({ ...PASS, hostname: 'other.example' }).fetch);
  expect(await verifyTurnstile(REQUEST)).toEqual({ ok: false, code: 'hostname-mismatch' });

  vi.useFakeTimers();
  vi.stubGlobal('fetch', hanging().fetch);

  let settled: TurnstileResult | null = null;

  void verifyTurnstile(REQUEST).then((result: TurnstileResult) => {
    settled = result;
  });

  await vi.advanceTimersByTimeAsync(2999);
  expect(settled).toBeNull();
  await vi.advanceTimersByTimeAsync(1);
  expect(settled).toEqual({ ok: false, code: 'unavailable' });
});

caseTest('sec.turnstile.log-code-only', 'the log carries the key and the code', async () => {
  vi.stubEnv('TURNSTILE_SECRET_KEY', SECRET);
  vi.stubEnv('SITE_URL', `https://${HOST}`);

  const log = vi.spyOn(console, 'warn').mockImplementation(() => {});

  vi.stubGlobal('fetch', answering(PASS).fetch);
  await verifyTurnstile(REQUEST);
  expect(log).not.toHaveBeenCalled();

  vi.stubGlobal('fetch', answering({ success: false, 'error-codes': ['bad-secret'] }).fetch);
  await verifyTurnstile(REQUEST);

  expect(log.mock.calls).toEqual([['contact.turnstile.failed', 'rejected']]);
  expect(JSON.stringify(log.mock.calls)).not.toContain(TOKEN);
  expect(JSON.stringify(log.mock.calls)).not.toContain(SECRET);
});
