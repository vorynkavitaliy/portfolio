import { test } from 'vitest';

import type { RateLimitCaseId } from '@tests/back/server/rate-limit/rate-limit.cases';

export const caseTest = (
  id: RateLimitCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
