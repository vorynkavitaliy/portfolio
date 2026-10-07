import { test } from 'vitest';

import type { ClientIpCaseId } from '@tests/back/server/request/client-ip.cases';

export const caseTest = (
  id: ClientIpCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
