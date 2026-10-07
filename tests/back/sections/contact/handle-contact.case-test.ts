import { test } from 'vitest';

import type { HandleContactCaseId } from '@tests/back/sections/contact/handle-contact.cases';

export const caseTest = (
  id: HandleContactCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
