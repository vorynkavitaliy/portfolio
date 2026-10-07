export type HealthCaseSource = 'owner-2026-10-07' | 'security-md' | 'rfc-9111';

export type HealthCase = Readonly<{
  id: string;
  source: HealthCaseSource;
  reference: string;
  expected: string;
}>;

const DEPLOY_DESIGN = 'deploy slice envelope 2026-10-07 design §2 «/api/health»';

export const HEALTH_CASES = [
  {
    id: 'health.ok',
    source: 'owner-2026-10-07',
    reference: `${DEPLOY_DESIGN}: GET → 200`,
    expected: 'GET answers status 200',
  },
  {
    id: 'health.body',
    source: 'owner-2026-10-07',
    reference: `${DEPLOY_DESIGN}: body { ok: true }`,
    expected: 'the JSON body is exactly { ok: true }',
  },
  {
    id: 'sec.health.no-details',
    source: 'security-md',
    reference:
      'rules/security.md §2 «No secret … in logs, analytics or error reports»; design §2 «no env/secret details»',
    expected: 'the body carries no key besides ok, even with server env present',
  },
  {
    id: 'health.no-store',
    source: 'rfc-9111',
    reference: 'RFC 9111 §5.2.2.5 no-store; design §2 «Cache-Control: no-store»',
    expected: 'Cache-Control is exactly no-store',
  },
  {
    id: 'health.json',
    source: 'owner-2026-10-07',
    reference: `${DEPLOY_DESIGN}: JSON body`,
    expected: 'Content-Type is application/json',
  },
] as const satisfies readonly HealthCase[];

export type HealthCaseId = (typeof HEALTH_CASES)[number]['id'];
