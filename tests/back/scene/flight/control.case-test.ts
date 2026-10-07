import { test } from 'vitest';

import type { ControlCaseId } from '@tests/back/scene/flight/control.cases';

export const caseTest = (id: ControlCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
