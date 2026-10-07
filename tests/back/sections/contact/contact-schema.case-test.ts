import { test } from 'vitest';

import type { ContactSchemaCaseId } from '@tests/back/sections/contact/contact-schema.cases';

export const caseTest = (
  id: ContactSchemaCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
