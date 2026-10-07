import { test } from 'vitest';

import type { MailCaseId } from '@tests/back/server/mail/mail.cases';

export const caseTest = (
  id: MailCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
