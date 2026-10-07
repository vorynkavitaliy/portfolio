import { test } from 'vitest';

import type { HudCaseId } from '@tests/front/ui/hud/hud.cases';

export const caseTest = (
  id: HudCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
