import { expect } from 'vitest';

import { caseTest } from '@tests/back/app/health/health.case-test';
import { healthResponse as GET } from '@/core/http/health-response';

caseTest('health.ok', 'GET answers 200', () => {
  expect(GET().status).toBe(200);
});

caseTest('health.body', 'the body is exactly { ok: true }', async () => {
  await expect(GET().json()).resolves.toStrictEqual({ ok: true });
});

caseTest('sec.health.no-details', 'no env value or extra key leaks', async () => {
  expect(process.env['SMTP_PASS']).not.toBeUndefined();

  const text: string = await GET().text();

  const body: unknown = JSON.parse(text);

  expect(body).toStrictEqual({ ok: true });
  expect(text).not.toContain(process.env['SMTP_PASS'] ?? '');
  expect(text).not.toContain(process.env['SMTP_HOST'] ?? '');
});

caseTest('health.no-store', 'responses are never cached', () => {
  expect(GET().headers.get('cache-control')).toBe('no-store');
});

caseTest('health.json', 'the content type is JSON', () => {
  expect(GET().headers.get('content-type')).toMatch(/^application\/json/);
});
