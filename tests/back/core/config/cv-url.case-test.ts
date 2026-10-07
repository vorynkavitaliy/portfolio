import { test } from 'vitest';

import type { CvUrlCaseId } from '@tests/back/core/config/cv-url.cases';

export const caseTest = (
  id: CvUrlCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
