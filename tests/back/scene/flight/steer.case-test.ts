import { test } from 'vitest';

import type { SteerCaseId } from '@tests/back/scene/flight/steer.cases';

export const caseTest = (id: SteerCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
