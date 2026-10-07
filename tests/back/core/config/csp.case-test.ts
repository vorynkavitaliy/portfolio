import { test } from 'vitest';

import type { CspCaseId } from '@tests/back/core/config/csp.cases';

export const caseTest = (
  id: CspCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
