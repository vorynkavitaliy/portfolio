import { test } from 'vitest';

import type { IntegrateCaseId } from '@tests/back/scene/flight/integrate.cases';

export const caseTest = (id: IntegrateCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
