import { test } from 'vitest';

import type { PlaneCaseId } from '@tests/back/scene/flight/plane.cases';

export const caseTest = (id: PlaneCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
