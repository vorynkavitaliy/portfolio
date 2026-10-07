import type { RateLimitCaseId } from '@tests/back/server/rate-limit/rate-limit.cases';

export type RateLimitMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly RateLimitCaseId[];
}>;

const LIMITER = 'src/server/rate-limit/rate-limit.ts';
const POLICIES = 'src/server/rate-limit/rate-limit.constants.ts';

export const RATE_LIMIT_MUTATIONS: readonly RateLimitMutation[] = [
  {
    id: 'ip.capacity-raised',
    file: POLICIES,
    find: 'CONTACT_IP_POLICY: RatePolicy = { capacity: 3,',
    replace: 'CONTACT_IP_POLICY: RatePolicy = { capacity: 4,',
    caseIds: ['sec.limit.contact.ip-burst'],
  },
  {
    id: 'ip.refill-faster',
    file: POLICIES,
    find: 'refillMs: 600_000',
    replace: 'refillMs: 300_000',
    caseIds: ['sec.limit.contact.ip-refill'],
  },
  {
    id: 'site.capacity-raised',
    file: POLICIES,
    find: 'capacity: 20,',
    replace: 'capacity: 21,',
    caseIds: ['sec.limit.contact.site-burst'],
  },
  {
    id: 'site.refill-faster',
    file: POLICIES,
    find: 'refillMs: 180_000',
    replace: 'refillMs: 60_000',
    caseIds: ['sec.limit.contact.site-burst'],
  },
  {
    id: 'tolerance.off-by-one',
    file: LIMITER,
    find: 'policy.refillMs * (policy.capacity - 1)',
    replace: 'policy.refillMs * policy.capacity',
    caseIds: [
      'sec.limit.ip.burst',
      'sec.limit.ip.capacity-cap',
      'sec.limit.keys-independent',
      'sec.limit.site.burst',
    ],
  },
  {
    id: 'reject.inclusive',
    file: LIMITER,
    find: 'theoretical - at > tolerance',
    replace: 'theoretical - at >= tolerance',
    caseIds: ['sec.limit.ip.burst', 'sec.limit.ip.refill', 'sec.limit.site.refill'],
  },
  {
    id: 'idle.not-capped',
    file: LIMITER,
    find: 'Math.max(arrivals.get(key) ?? at, at)',
    replace: 'arrivals.get(key) ?? at',
    caseIds: ['sec.limit.ip.capacity-cap'],
  },
  {
    id: 'rejection.moves-bucket',
    file: LIMITER,
    find: '    if (theoretical - at > tolerance) {\n      return false;',
    replace:
      '    if (theoretical - at > tolerance) {\n      arrivals.set(key, theoretical + policy.refillMs);\n\n      return false;',
    caseIds: ['sec.limit.ip.rejections-free'],
  },
  {
    id: 'keys.shared',
    file: LIMITER,
    find: 'arrivals.get(key) ?? at',
    replace: "arrivals.get('all') ?? at",
    caseIds: ['sec.limit.keys-independent'],
  },
  {
    id: 'limiter.removed',
    file: LIMITER,
    find: 'return ipLimiter.take(ip) && siteLimiter.take(SITE_KEY);',
    replace: 'return true;',
    caseIds: ['sec.limit.contact.ip-burst', 'sec.limit.contact.site-burst'],
  },
  {
    id: 'site-bucket.dropped',
    file: LIMITER,
    find: 'return ipLimiter.take(ip) && siteLimiter.take(SITE_KEY);',
    replace: 'return ipLimiter.take(ip);',
    caseIds: ['sec.limit.contact.site-burst', 'sec.limit.contact.ip-rejection-keeps-site'],
  },
  {
    id: 'order.ip-site-swapped',
    file: LIMITER,
    find: 'return ipLimiter.take(ip) && siteLimiter.take(SITE_KEY);',
    replace: 'return siteLimiter.take(SITE_KEY) && ipLimiter.take(ip);',
    caseIds: ['sec.limit.contact.ip-rejection-keeps-site'],
  },
  {
    id: 'ip-bucket.wrong-policy',
    file: LIMITER,
    find: 'createLimiter(CONTACT_IP_POLICY, wallClock)',
    replace: 'createLimiter(CONTACT_SITE_POLICY, wallClock)',
    caseIds: ['sec.limit.contact.ip-burst', 'sec.limit.contact.ip-refill'],
  },
  {
    id: 'sweep.never',
    file: LIMITER,
    find: 'if (arrivals.size > LIMITER_SWEEP_SIZE) {\n      sweep(at);',
    replace: 'if (arrivals.size < 0) {\n      sweep(at);',
    caseIds: ['sec.limit.sweep.expired', 'sec.limit.sweep.bound'],
  },
  {
    id: 'sweep.clears-all',
    file: LIMITER,
    find: '      if (theoretical <= at) {\n        arrivals.delete(key);',
    replace: '      if (theoretical <= at + 1e12) {\n        arrivals.delete(key);',
    caseIds: ['sec.limit.sweep.keeps-live'],
  },
  {
    id: 'sweep.no-eviction',
    file: LIMITER,
    find: '      arrivals.delete(key);\n    }\n  };',
    replace: '      break;\n    }\n  };',
    caseIds: ['sec.limit.sweep.bound'],
  },
];
