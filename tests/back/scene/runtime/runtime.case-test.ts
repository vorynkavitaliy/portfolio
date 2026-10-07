import { test } from 'vitest';

import type { RuntimeCaseId } from '@tests/back/scene/runtime/runtime.cases';

export const caseTest = (id: RuntimeCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
