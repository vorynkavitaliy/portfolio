export type RateLimitCaseSource = 'security-md' | 'spec' | 'owner-2026-10-07';

export type RateLimitCase = Readonly<{
  id: string;
  source: RateLimitCaseSource;
  reference: string;
  expected: string;
}>;

const LIMITER = 'rules/security.md §1 «Limiter first» (IP bucket 3, refill 1 per 10 min)';
const SITE = 'rules/security.md §1 «Limiter first» (site bucket 20, refill 1 per 3 min)';

const ORDER =
  'plan 0002 §5.7 takeContactToken (site bucket touched only when the IP bucket accepts)';

const SWEEP = 'plan 0002 §5.7 createLimiter and S11 tests «the sweep bounds memory»';

export const RATE_LIMIT_CASES = [
  {
    id: 'sec.limit.ip.burst',
    source: 'security-md',
    reference: LIMITER,
    expected: 'with the IP policy three takes at one instant pass and the fourth is rejected',
  },
  {
    id: 'sec.limit.ip.refill',
    source: 'security-md',
    reference: LIMITER,
    expected:
      'after the burst a take 1 ms before 10 min is rejected, at exactly 10 min one passes and the next is rejected',
  },
  {
    id: 'sec.limit.ip.capacity-cap',
    source: 'security-md',
    reference: LIMITER,
    expected: 'after a day without traffic still only three takes pass, the fourth is rejected',
  },
  {
    id: 'sec.limit.ip.rejections-free',
    source: 'security-md',
    reference: `${LIMITER}; GCRA: a rejected request does not move the bucket`,
    expected:
      'rejected takes every minute after the burst do not delay the refill: at 10 min one take passes',
  },
  {
    id: 'sec.limit.keys-independent',
    source: 'security-md',
    reference: `${LIMITER} «per client IP»`,
    expected: 'an exhausted bucket for one IP leaves another IP with its full three takes',
  },
  {
    id: 'sec.limit.site.burst',
    source: 'security-md',
    reference: SITE,
    expected: 'with the site policy twenty takes pass and the twenty-first is rejected',
  },
  {
    id: 'sec.limit.site.refill',
    source: 'security-md',
    reference: SITE,
    expected:
      'after the site burst a take 1 ms before 3 min is rejected, at exactly 3 min one passes and the next is rejected',
  },
  {
    id: 'sec.limit.contact.ip-burst',
    source: 'spec',
    reference: 'spec FR-049 (per-IP limiter, RATE_LIMITED when empty); rules/security.md §1',
    expected:
      'takeContactToken for one IP returns true three times and false the fourth time on the wall clock',
  },
  {
    id: 'sec.limit.contact.ip-refill',
    source: 'security-md',
    reference: LIMITER,
    expected: 'takeContactToken for the same IP returns true once more 10 min after the burst',
  },
  {
    id: 'sec.limit.contact.site-burst',
    source: 'spec',
    reference: 'spec FR-049 (site-wide limiter); rules/security.md §1',
    expected:
      'twenty different IPs get a token, a twenty-first fresh IP is rejected; 3 min later one fresh IP passes',
  },
  {
    id: 'sec.limit.contact.ip-rejection-keeps-site',
    source: 'owner-2026-10-07',
    reference: ORDER,
    expected:
      'one IP takes 3 then is rejected 10 times; 17 other IPs then pass and the 18th is rejected (the rejections took no site token)',
  },
  {
    id: 'sec.limit.sweep.expired',
    source: 'owner-2026-10-07',
    reference: SWEEP,
    expected:
      'with LIMITER_SWEEP_SIZE expired keys stored, one more take sweeps them and the limiter holds 1 key',
  },
  {
    id: 'sec.limit.sweep.keeps-live',
    source: 'owner-2026-10-07',
    reference: SWEEP,
    expected: 'a sweep keeps a key whose bucket is still empty: that key stays rejected after it',
  },
  {
    id: 'sec.limit.sweep.bound',
    source: 'owner-2026-10-07',
    reference: SWEEP,
    expected:
      'LIMITER_SWEEP_SIZE + 5 live keys never leave more than LIMITER_SWEEP_SIZE keys stored',
  },
] as const satisfies readonly RateLimitCase[];

export type RateLimitCaseId = (typeof RATE_LIMIT_CASES)[number]['id'];
