import { test } from 'vitest';

import type { ContactCaseId } from '@tests/front/ui/contact/contact.cases';

export const caseTest = (
  id: ContactCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
