import { test } from 'vitest';

import type { TrackedLinkCaseId } from '@tests/front/ui/shared/tracked-link.cases';

export const caseTest = (
  id: TrackedLinkCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
