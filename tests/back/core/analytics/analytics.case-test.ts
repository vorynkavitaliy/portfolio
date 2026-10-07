import { test } from 'vitest';

import type { AnalyticsCaseId } from '@tests/back/core/analytics/analytics.cases';

export const caseTest = (
  id: AnalyticsCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
