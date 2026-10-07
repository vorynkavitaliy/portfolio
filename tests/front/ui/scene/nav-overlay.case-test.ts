import { test } from 'vitest';

import type { NavOverlayCaseId } from '@tests/front/ui/scene/nav-overlay.cases';

export const caseTest = (
  id: NavOverlayCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
