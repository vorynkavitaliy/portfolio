import { test } from 'vitest';

import type { WorldShellCaseId } from '@tests/front/ui/world/world-shell.cases';

export const caseTest = (
  id: WorldShellCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
