import { test } from 'vitest';

import type { HealthCaseId } from '@tests/back/app/health/health.cases';

export const caseTest = (
  id: HealthCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
