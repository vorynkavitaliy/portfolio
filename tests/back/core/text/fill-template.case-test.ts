import { test } from 'vitest';

import type { FillTemplateCaseId } from '@tests/back/core/text/fill-template.cases';

export const caseTest = (
  id: FillTemplateCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
