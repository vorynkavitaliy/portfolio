import 'server-only';

export type TurnstileFailure =
  | 'missing-token'
  | 'unavailable'
  | 'bad-response'
  | 'rejected'
  | 'hostname-mismatch'
  | 'action-mismatch';

export type TurnstileResult = { ok: true } | { ok: false; code: TurnstileFailure };

export type TurnstileRequest = Readonly<{ token: string; ip: string; action: string }>;

export type TurnstileConfig = Readonly<{
  secret: string;
  hostname: string;
  timeoutMs: number;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  idempotencyKey: () => string;
}>;

export type TurnstileVerifier = (request: TurnstileRequest) => Promise<TurnstileResult>;
