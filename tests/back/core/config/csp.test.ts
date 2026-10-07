import { expect } from 'vitest';

import { caseTest } from '@tests/back/core/config/csp.case-test';
import { buildContentSecurityPolicy, createNonce } from '@/core/config/csp';

const PRODUCTION_POLICY =
  "default-src 'self'; " +
  "script-src 'self' 'nonce-n0nce' 'strict-dynamic'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; " +
  "font-src 'self'; " +
  "connect-src 'self'; " +
  "worker-src 'self'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'; " +
  "frame-ancestors 'none'";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const scriptSrc = (policy: string): string => {
  return (
    policy.split('; ').find((directive: string) => {
      return directive.startsWith('script-src ');
    }) ?? ''
  );
};

caseTest('sec.csp.exact.production', 'equals the documented policy', () => {
  expect(buildContentSecurityPolicy('n0nce', false)).toBe(PRODUCTION_POLICY);
});

caseTest('sec.csp.exact.development', 'adds only unsafe-eval to script-src', () => {
  expect(buildContentSecurityPolicy('n0nce', true)).toBe(
    PRODUCTION_POLICY.replace("'strict-dynamic';", "'strict-dynamic' 'unsafe-eval';"),
  );
});

caseTest('sec.csp.script.no-unsafe', 'production script-src has no unsafe keyword', () => {
  const directive: string = scriptSrc(buildContentSecurityPolicy('n0nce', false));

  expect(directive).not.toBe('');
  expect(directive).not.toContain("'unsafe-inline'");
  expect(directive).not.toContain("'unsafe-eval'");
});

caseTest('sec.csp.nonce.carried', 'the given nonce is in script-src', () => {
  const nonce = 'ZjNhOS1xdWl6';

  expect(scriptSrc(buildContentSecurityPolicy(nonce, false)).split(' ')).toContain(
    `'nonce-${nonce}'`,
  );
});

caseTest('sec.csp.nonce.fresh', 'every call gives a new value', () => {
  const nonces: readonly string[] = Array.from({ length: 100 }, () => {
    return createNonce();
  });

  expect(new Set(nonces).size).toBe(100);
});

caseTest('sec.csp.nonce.uuid-base64', 'decodes to a v4 UUID', () => {
  const nonce: string = createNonce();
  const decoded: string = Buffer.from(nonce, 'base64').toString('utf8');

  expect(Buffer.from(decoded, 'utf8').toString('base64')).toBe(nonce);
  expect(decoded).toMatch(UUID_V4);
});
