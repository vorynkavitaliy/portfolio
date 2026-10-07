import { test } from 'vitest';

import type { RoutesCaseId } from '@tests/back/scene/flight/routes.cases';

export const caseTest = (id: RoutesCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
