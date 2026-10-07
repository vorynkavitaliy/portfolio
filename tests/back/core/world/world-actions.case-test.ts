import { test } from 'vitest';

import type { WorldActionsCaseId } from '@tests/back/core/world/world-actions.cases';

export const caseTest = (
  id: WorldActionsCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
