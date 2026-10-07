import { test } from 'vitest';

import type { StationLinkCaseId } from '@tests/front/ui/shared/station-link.cases';

export const caseTest = (
  id: StationLinkCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
