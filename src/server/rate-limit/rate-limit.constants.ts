import 'server-only';

import type { RatePolicy } from '@/server/rate-limit/rate-limit.types';

export const CONTACT_IP_POLICY: RatePolicy = { capacity: 3, refillMs: 600_000 };

export const CONTACT_SITE_POLICY: RatePolicy = { capacity: 20, refillMs: 180_000 };

export const LIMITER_SWEEP_SIZE = 10_000;

export const SITE_KEY = 'site';
