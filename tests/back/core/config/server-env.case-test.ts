import { test } from 'vitest';

import type { ServerEnvCaseId } from '@tests/back/core/config/server-env.cases';

export const caseTest = (
  id: ServerEnvCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
