import 'server-only';

import {
  CONTACT_IP_POLICY,
  CONTACT_SITE_POLICY,
  LIMITER_SWEEP_SIZE,
  SITE_KEY,
} from '@/server/rate-limit/rate-limit.constants';

import type { Limiter, RatePolicy } from '@/server/rate-limit/rate-limit.types';

export const createLimiter = (policy: RatePolicy, now: () => number): Limiter => {
  const tolerance: number = policy.refillMs * (policy.capacity - 1);
  const arrivals = new Map<string, number>();

  const sweep = (at: number): void => {
    for (const [key, theoretical] of arrivals) {
      if (theoretical <= at) {
        arrivals.delete(key);
      }
    }

    for (const key of arrivals.keys()) {
      if (arrivals.size <= LIMITER_SWEEP_SIZE) {
        break;
      }

      arrivals.delete(key);
    }
  };

  const take = (key: string): boolean => {
    const at: number = now();
    const theoretical: number = Math.max(arrivals.get(key) ?? at, at);

    if (theoretical - at > tolerance) {
      return false;
    }

    arrivals.set(key, theoretical + policy.refillMs);

    if (arrivals.size > LIMITER_SWEEP_SIZE) {
      sweep(at);
    }

    return true;
  };

  const size = (): number => {
    return arrivals.size;
  };

  return { take, size };
};

const wallClock = (): number => {
  return Date.now();
};

const ipLimiter: Limiter = createLimiter(CONTACT_IP_POLICY, wallClock);

const siteLimiter: Limiter = createLimiter(CONTACT_SITE_POLICY, wallClock);

export const takeContactToken = (ip: string): boolean => {
  return ipLimiter.take(ip) && siteLimiter.take(SITE_KEY);
};
