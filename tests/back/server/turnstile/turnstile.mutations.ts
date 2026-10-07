import type { TurnstileCaseId } from '@tests/back/server/turnstile/turnstile.cases';

export type TurnstileMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly TurnstileCaseId[];
}>;

const VERIFIER = 'src/server/turnstile/turnstile.ts';
const CONSTANTS = 'src/server/turnstile/turnstile.constants.ts';

export const TURNSTILE_MUTATIONS: readonly TurnstileMutation[] = [
  {
    id: 'success.ignored',
    file: VERIFIER,
    find: '  if (!verdict.success) {',
    replace: '  if (verdict.success === undefined) {',
    caseIds: ['sec.turnstile.rejected', 'sec.turnstile.test-secret', 'sec.turnstile.log-code-only'],
  },
  {
    id: 'hostname.unchecked',
    file: VERIFIER,
    find: 'if (verdict.hostname !== config.hostname) {',
    replace: 'if (verdict.hostname === undefined && verdict.hostname !== undefined) {',
    caseIds: [
      'sec.turnstile.hostname-mismatch',
      'sec.turnstile.test-secret',
      'sec.turnstile.wiring',
    ],
  },
  {
    id: 'action.unchecked',
    file: VERIFIER,
    find: 'if (verdict.action !== request.action) {',
    replace: 'if (verdict.action === undefined && verdict.action !== undefined) {',
    caseIds: ['sec.turnstile.action-mismatch'],
  },
  {
    id: 'test-secret.any-secret',
    file: VERIFIER,
    find: 'if (CLOUDFLARE_TEST_SECRETS.includes(config.secret)) {',
    replace: "if (config.secret !== '') {",
    caseIds: [
      'sec.turnstile.hostname-mismatch',
      'sec.turnstile.action-mismatch',
      'sec.turnstile.test-secret',
    ],
  },
  {
    id: 'test-secret.not-honoured',
    file: VERIFIER,
    find: 'if (CLOUDFLARE_TEST_SECRETS.includes(config.secret)) {',
    replace: "if (config.secret === '') {",
    caseIds: ['sec.turnstile.test-secret'],
  },
  {
    id: 'token.empty-sent',
    file: VERIFIER,
    find: "if (request.token === '' || request.token.length > MAX_TOKEN_LENGTH) {",
    replace: 'if (request.token.length > MAX_TOKEN_LENGTH) {',
    caseIds: ['sec.turnstile.missing-token'],
  },
  {
    id: 'token.max-off-by-one',
    file: CONSTANTS,
    find: 'MAX_TOKEN_LENGTH = 2048',
    replace: 'MAX_TOKEN_LENGTH = 2047',
    caseIds: ['sec.turnstile.missing-token'],
  },
  {
    id: 'token.oversize-sent',
    file: VERIFIER,
    find: "if (request.token === '' || request.token.length > MAX_TOKEN_LENGTH) {",
    replace: "if (request.token === '') {",
    caseIds: ['sec.turnstile.missing-token'],
  },
  {
    id: 'remoteip.dropped',
    file: VERIFIER,
    find: "    body.set('remoteip', request.ip);\n",
    replace: '',
    caseIds: ['sec.turnstile.request-body'],
  },
  {
    id: 'remoteip.unknown-sent',
    file: VERIFIER,
    find: 'if (request.ip !== UNKNOWN_CLIENT_IP) {',
    replace: "if (request.ip !== '') {",
    caseIds: ['sec.turnstile.request-body'],
  },
  {
    id: 'idempotency.dropped',
    file: VERIFIER,
    find: '    idempotency_key: config.idempotencyKey(),\n',
    replace: '',
    caseIds: ['sec.turnstile.request-body'],
  },
  {
    id: 'secret.wrong',
    file: VERIFIER,
    find: '    secret: config.secret,\n',
    replace: "    secret: 'static-secret',\n",
    caseIds: ['sec.turnstile.request-body', 'sec.turnstile.wiring'],
  },
  {
    id: 'url.wrong',
    file: CONSTANTS,
    find: "'https://challenges.cloudflare.com/turnstile/v0/siteverify'",
    replace: "'https://challenges.cloudflare.com/turnstile/v0/verify'",
    caseIds: ['sec.turnstile.success'],
  },
  {
    id: 'method.get',
    file: VERIFIER,
    find: "      method: 'POST',",
    replace: "      method: 'GET',",
    caseIds: ['sec.turnstile.success'],
  },
  {
    id: 'timeout.ignored',
    file: VERIFIER,
    find: '      signal: controller.signal,\n',
    replace: '',
    caseIds: ['sec.turnstile.timeout', 'sec.turnstile.wiring'],
  },
  {
    id: 'timeout.raised',
    file: CONSTANTS,
    find: 'VERIFY_TIMEOUT_MS = 3000',
    replace: 'VERIFY_TIMEOUT_MS = 10000',
    caseIds: ['sec.turnstile.wiring'],
  },
  {
    id: 'http-status.ignored',
    file: VERIFIER,
    find: 'return response.ok ? await readJson(response) : null;',
    replace: 'return await readJson(response);',
    caseIds: ['sec.turnstile.network-error'],
  },
  {
    id: 'network-error.as-pass',
    file: VERIFIER,
    find: "    if (payload === null) {\n      return failure('unavailable');",
    replace: '    if (payload === null) {\n      return { ok: true };',
    caseIds: ['sec.turnstile.network-error', 'sec.turnstile.timeout', 'sec.turnstile.wiring'],
  },
  {
    id: 'schema.success-any',
    file: VERIFIER,
    find: '  success: z.boolean(),',
    replace: '  success: z.unknown(),',
    caseIds: ['sec.turnstile.bad-response'],
  },
  {
    id: 'rejected.provider-text',
    file: VERIFIER,
    find: "    return failure('rejected');",
    replace:
      "    return { ok: false, code: 'rejected', detail: 'invalid-input-secret' } as TurnstileResult;",
    caseIds: ['sec.turnstile.rejected'],
  },
  {
    id: 'log.token',
    file: VERIFIER,
    find: 'console.warn(TURNSTILE_FAILED_LOG, result.code);',
    replace: 'console.warn(TURNSTILE_FAILED_LOG, result.code, request.token);',
    caseIds: ['sec.turnstile.log-code-only'],
  },
  {
    id: 'log.success',
    file: VERIFIER,
    find: '  if (!result.ok) {\n    console.warn',
    replace: '  if (result.ok || !result.ok) {\n    console.warn',
    caseIds: ['sec.turnstile.log-code-only'],
  },
  {
    id: 'wiring.hostname-from-elsewhere',
    file: VERIFIER,
    find: 'hostname: getSiteUrl().hostname,',
    replace: "hostname: 'localhost',",
    caseIds: ['sec.turnstile.wiring'],
  },
];
