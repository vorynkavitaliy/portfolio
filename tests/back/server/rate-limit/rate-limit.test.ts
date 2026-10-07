import { afterEach, expect, vi } from 'vitest';

import { caseTest } from '@tests/back/server/rate-limit/rate-limit.case-test';
import { createLimiter } from '@/server/rate-limit/rate-limit';
import { LIMITER_SWEEP_SIZE } from '@/server/rate-limit/rate-limit.constants';

import type { Limiter, RatePolicy } from '@/server/rate-limit/rate-limit.types';

const IP_POLICY: RatePolicy = { capacity: 3, refillMs: 600_000 };
const SITE_POLICY: RatePolicy = { capacity: 20, refillMs: 180_000 };
const TEN_MINUTES = 600_000;
const THREE_MINUTES = 180_000;
const ONE_MINUTE = 60_000;
const ONE_DAY = 86_400_000;
const START = Date.UTC(2026, 9, 7, 12, 0, 0);
const IP = '203.0.113.7';

type FakeClock = { now: () => number; advance: (ms: number) => void };

const fakeClock = (): FakeClock => {
  let current = START;

  return {
    now: () => {
      return current;
    },
    advance: (ms: number) => {
      current += ms;
    },
  };
};

const takeMany = (take: () => boolean, count: number): boolean[] => {
  return Array.from({ length: count }, () => {
    return take();
  });
};

const peer = (index: number): string => {
  return `198.51.100.${String(index)}`;
};

const loadContactLimiter = async (): Promise<(ip: string) => boolean> => {
  const { takeContactToken } = await import('@/server/rate-limit/rate-limit');

  return takeContactToken;
};

afterEach(() => {
  vi.useRealTimers();
});

caseTest('sec.limit.ip.burst', 'three pass, the fourth is rejected', () => {
  const clock = fakeClock();
  const limiter: Limiter = createLimiter(IP_POLICY, clock.now);

  expect(
    takeMany(() => {
      return limiter.take(IP);
    }, 4),
  ).toEqual([true, true, true, false]);
});

caseTest('sec.limit.ip.refill', 'one token per 10 min after the burst', () => {
  const clock = fakeClock();
  const limiter: Limiter = createLimiter(IP_POLICY, clock.now);

  takeMany(() => {
    return limiter.take(IP);
  }, 3);

  clock.advance(TEN_MINUTES - 1);
  expect(limiter.take(IP)).toBe(false);

  clock.advance(1);
  expect(limiter.take(IP)).toBe(true);
  expect(limiter.take(IP)).toBe(false);
});

caseTest('sec.limit.ip.capacity-cap', 'a long pause refills to three, not more', () => {
  const clock = fakeClock();
  const limiter: Limiter = createLimiter(IP_POLICY, clock.now);

  limiter.take(IP);
  clock.advance(ONE_DAY);

  expect(
    takeMany(() => {
      return limiter.take(IP);
    }, 4),
  ).toEqual([true, true, true, false]);
});

caseTest('sec.limit.ip.rejections-free', 'rejected takes do not move the refill', () => {
  const clock = fakeClock();
  const limiter: Limiter = createLimiter(IP_POLICY, clock.now);

  takeMany(() => {
    return limiter.take(IP);
  }, 3);

  const rejected: boolean[] = Array.from({ length: 9 }, () => {
    clock.advance(ONE_MINUTE);

    return limiter.take(IP);
  });

  expect(rejected).toEqual(
    Array.from({ length: 9 }, () => {
      return false;
    }),
  );

  clock.advance(ONE_MINUTE);
  expect(limiter.take(IP)).toBe(true);
});

caseTest('sec.limit.keys-independent', 'another IP keeps its full bucket', () => {
  const clock = fakeClock();
  const limiter: Limiter = createLimiter(IP_POLICY, clock.now);

  takeMany(() => {
    return limiter.take(IP);
  }, 4);

  expect(
    takeMany(() => {
      return limiter.take(peer(1));
    }, 4),
  ).toEqual([true, true, true, false]);
});

caseTest('sec.limit.site.burst', 'twenty pass, the twenty-first is rejected', () => {
  const clock = fakeClock();
  const limiter: Limiter = createLimiter(SITE_POLICY, clock.now);

  const results: boolean[] = takeMany(() => {
    return limiter.take('site');
  }, 21);

  expect(results.slice(0, 20)).toEqual(
    Array.from({ length: 20 }, () => {
      return true;
    }),
  );

  expect(results[20]).toBe(false);
});

caseTest('sec.limit.site.refill', 'one token per 3 min after the burst', () => {
  const clock = fakeClock();
  const limiter: Limiter = createLimiter(SITE_POLICY, clock.now);

  takeMany(() => {
    return limiter.take('site');
  }, 20);

  clock.advance(THREE_MINUTES - 1);
  expect(limiter.take('site')).toBe(false);

  clock.advance(1);
  expect(limiter.take('site')).toBe(true);
  expect(limiter.take('site')).toBe(false);
});

caseTest('sec.limit.contact.ip-burst', 'the wired IP bucket holds three', async () => {
  vi.useFakeTimers({ now: START, toFake: ['Date'] });

  const take = await loadContactLimiter();

  expect(
    takeMany(() => {
      return take(IP);
    }, 4),
  ).toEqual([true, true, true, false]);
});

caseTest('sec.limit.contact.ip-refill', 'the wired IP bucket refills after 10 min', async () => {
  vi.useFakeTimers({ now: START, toFake: ['Date'] });

  const take = await loadContactLimiter();

  takeMany(() => {
    return take(IP);
  }, 4);

  vi.setSystemTime(START + TEN_MINUTES - 1);
  expect(take(IP)).toBe(false);

  vi.setSystemTime(START + TEN_MINUTES);
  expect(take(IP)).toBe(true);
  expect(take(IP)).toBe(false);
});

caseTest('sec.limit.contact.site-burst', 'twenty IPs pass, then one per 3 min', async () => {
  vi.useFakeTimers({ now: START, toFake: ['Date'] });

  const take = await loadContactLimiter();

  const results: boolean[] = Array.from({ length: 21 }, (_unused, index) => {
    return take(peer(index + 1));
  });

  expect(results.slice(0, 20)).toEqual(
    Array.from({ length: 20 }, () => {
      return true;
    }),
  );

  expect(results[20]).toBe(false);

  vi.setSystemTime(START + THREE_MINUTES - 1);
  expect(take(peer(30))).toBe(false);

  vi.setSystemTime(START + THREE_MINUTES);
  expect(take(peer(31))).toBe(true);
  expect(take(peer(32))).toBe(false);
});

caseTest(
  'sec.limit.contact.ip-rejection-keeps-site',
  'IP rejections take no site token',
  async () => {
    vi.useFakeTimers({ now: START, toFake: ['Date'] });

    const take = await loadContactLimiter();

    expect(
      takeMany(() => {
        return take(IP);
      }, 13),
    ).toEqual([
      true,
      true,
      true,
      ...Array.from({ length: 10 }, () => {
        return false;
      }),
    ]);

    const others: boolean[] = Array.from({ length: 18 }, (_unused, index) => {
      return take(peer(index + 1));
    });

    expect(others.slice(0, 17)).toEqual(
      Array.from({ length: 17 }, () => {
        return true;
      }),
    );

    expect(others[17]).toBe(false);
  },
);

caseTest('sec.limit.sweep.expired', 'expired keys are dropped', () => {
  const clock = fakeClock();
  const limiter: Limiter = createLimiter(IP_POLICY, clock.now);

  for (let index = 0; index < LIMITER_SWEEP_SIZE; index += 1) {
    limiter.take(`key-${String(index)}`);
  }

  expect(limiter.size()).toBe(10_000);

  clock.advance(TEN_MINUTES);
  limiter.take(IP);

  expect(limiter.size()).toBe(1);
});

caseTest('sec.limit.sweep.keeps-live', 'an empty bucket survives the sweep', () => {
  const clock = fakeClock();
  const limiter: Limiter = createLimiter(IP_POLICY, clock.now);

  takeMany(() => {
    return limiter.take(IP);
  }, 3);

  for (let index = 1; index < LIMITER_SWEEP_SIZE; index += 1) {
    limiter.take(`key-${String(index)}`);
  }

  clock.advance(TEN_MINUTES);
  expect(limiter.take(IP)).toBe(true);

  limiter.take('fresh-key');

  expect(limiter.size()).toBe(2);
  expect(limiter.take(IP)).toBe(false);
});

caseTest('sec.limit.sweep.bound', 'live keys never exceed the sweep size', () => {
  const clock = fakeClock();
  const limiter: Limiter = createLimiter(IP_POLICY, clock.now);
  let largest = 0;

  for (let index = 0; index < LIMITER_SWEEP_SIZE + 5; index += 1) {
    limiter.take(`key-${String(index)}`);
    largest = Math.max(largest, limiter.size());
  }

  expect(largest).toBe(10_000);
});
