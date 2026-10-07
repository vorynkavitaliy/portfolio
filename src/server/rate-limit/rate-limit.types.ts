import 'server-only';

export type RatePolicy = Readonly<{ capacity: number; refillMs: number }>;

export type Limiter = Readonly<{ take: (key: string) => boolean; size: () => number }>;
