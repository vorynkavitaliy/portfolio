import 'server-only';

import { z } from 'zod';

import { CLOUDFLARE_TEST_SECRETS, getTurnstileSecret } from '@/core/config/server-env';
import { getSiteUrl } from '@/core/config/site-url';
import { UNKNOWN_CLIENT_IP } from '@/server/request/client-ip';
import {
  MAX_TOKEN_LENGTH,
  SITEVERIFY_URL,
  TURNSTILE_FAILED_LOG,
  VERIFY_TIMEOUT_MS,
} from '@/server/turnstile/turnstile.constants';

import type {
  TurnstileConfig,
  TurnstileFailure,
  TurnstileRequest,
  TurnstileResult,
  TurnstileVerifier,
} from '@/server/turnstile/turnstile.types';

const siteverifySchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
});

type Siteverify = z.infer<typeof siteverifySchema>;

const failure = (code: TurnstileFailure): TurnstileResult => {
  return { ok: false, code };
};

const requestBody = (config: TurnstileConfig, request: TurnstileRequest): URLSearchParams => {
  const body = new URLSearchParams({
    secret: config.secret,
    response: request.token,
    idempotency_key: config.idempotencyKey(),
  });

  if (request.ip !== UNKNOWN_CLIENT_IP) {
    body.set('remoteip', request.ip);
  }

  return body;
};

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

const askCloudflare = async (
  config: TurnstileConfig,
  request: TurnstileRequest,
): Promise<unknown> => {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, config.timeoutMs);

  try {
    const response: Response = await config.fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: requestBody(config, request),
      signal: controller.signal,
    });

    return response.ok ? await readJson(response) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const judge = (
  config: TurnstileConfig,
  request: TurnstileRequest,
  verdict: Siteverify,
): TurnstileResult => {
  if (!verdict.success) {
    return failure('rejected');
  }

  if (CLOUDFLARE_TEST_SECRETS.includes(config.secret)) {
    return { ok: true };
  }

  if (verdict.hostname !== config.hostname) {
    return failure('hostname-mismatch');
  }

  if (verdict.action !== request.action) {
    return failure('action-mismatch');
  }

  return { ok: true };
};

export const createTurnstileVerifier = (config: TurnstileConfig): TurnstileVerifier => {
  return async (request: TurnstileRequest): Promise<TurnstileResult> => {
    if (request.token === '' || request.token.length > MAX_TOKEN_LENGTH) {
      return failure('missing-token');
    }

    const payload: unknown = await askCloudflare(config, request);

    if (payload === null) {
      return failure('unavailable');
    }

    const parsed = siteverifySchema.safeParse(payload);

    return parsed.success ? judge(config, request, parsed.data) : failure('bad-response');
  };
};

export const verifyTurnstile = async (request: TurnstileRequest): Promise<TurnstileResult> => {
  const verify: TurnstileVerifier = createTurnstileVerifier({
    secret: getTurnstileSecret(),
    hostname: getSiteUrl().hostname,
    timeoutMs: VERIFY_TIMEOUT_MS,
    fetch,
    idempotencyKey: () => {
      return crypto.randomUUID();
    },
  });

  const result: TurnstileResult = await verify(request);

  if (!result.ok) {
    console.warn(TURNSTILE_FAILED_LOG, result.code);
  }

  return result;
};
