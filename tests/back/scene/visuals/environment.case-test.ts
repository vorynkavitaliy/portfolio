import { test } from 'vitest';

import type { EnvironmentCaseId } from '@tests/back/scene/visuals/environment.cases';

export const caseTest = (id: EnvironmentCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
