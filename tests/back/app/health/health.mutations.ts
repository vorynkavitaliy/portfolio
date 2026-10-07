import type { HealthCaseId } from '@tests/back/app/health/health.cases';

export type HealthMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly HealthCaseId[];
}>;

const ROUTE = 'src/core/http/health-response.ts';

export const HEALTH_MUTATIONS: readonly HealthMutation[] = [
  {
    id: 'status.unavailable',
    file: ROUTE,
    find: "{ headers: { 'Cache-Control': 'no-store' } }",
    replace: "{ status: 503, headers: { 'Cache-Control': 'no-store' } }",
    caseIds: ['health.ok'],
  },
  {
    id: 'body.false',
    file: ROUTE,
    find: '{ ok: true }',
    replace: '{ ok: false }',
    caseIds: ['health.body', 'sec.health.no-details'],
  },
  {
    id: 'body.leaks-env',
    file: ROUTE,
    find: '{ ok: true }',
    replace: "{ ok: true, smtp: process.env['SMTP_HOST'] }",
    caseIds: ['health.body', 'sec.health.no-details'],
  },
  {
    id: 'cache.public',
    file: ROUTE,
    find: "'Cache-Control': 'no-store'",
    replace: "'Cache-Control': 'public, max-age=60'",
    caseIds: ['health.no-store'],
  },
  {
    id: 'body.text',
    file: ROUTE,
    find: "return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });",
    replace:
      "return new Response('{\"ok\":true}', { headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain' } });",
    caseIds: ['health.json'],
  },
];
