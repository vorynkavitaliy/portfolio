import { test } from 'vitest';

import type { MinimapDrawCaseId } from '@tests/front/ui/scene/minimap-draw.cases';

export const caseTest = (
  id: MinimapDrawCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
