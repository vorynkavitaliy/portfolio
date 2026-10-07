import { test } from 'vitest';

import type { DockingCaseId } from '@tests/back/scene/flight/docking.cases';

export const caseTest = (id: DockingCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
