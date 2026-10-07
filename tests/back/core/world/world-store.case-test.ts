import { test } from 'vitest';

import type { WorldStoreCaseId } from '@tests/back/core/world/world-store.cases';

export const caseTest = (
  id: WorldStoreCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
