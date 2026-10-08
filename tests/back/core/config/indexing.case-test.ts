import { test } from 'vitest';

import type { IndexingCaseId } from '@tests/back/core/config/indexing.cases';

export const caseTest = (
  id: IndexingCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
