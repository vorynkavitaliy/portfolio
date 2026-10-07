import { test } from 'vitest';

import type { WorldCaseId } from '@tests/back/scene/world/world.cases';

export const caseTest = (
  id: WorldCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
