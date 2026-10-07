import { test } from 'vitest';

import type { MinimapCaseId } from '@tests/back/scene/nav/minimap.cases';

export const caseTest = (id: MinimapCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
