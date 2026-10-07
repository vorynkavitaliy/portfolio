import { test } from 'vitest';

import type { NavMathCaseId } from '@tests/back/scene/nav/nav-math.cases';

export const caseTest = (id: NavMathCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
