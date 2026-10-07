import { test } from 'vitest';

import type { SiteUrlCaseId } from '@tests/back/core/config/site-url.cases';

export const caseTest = (
  id: SiteUrlCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
