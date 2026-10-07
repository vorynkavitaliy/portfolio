import { test } from 'vitest';

import type { CameraCaseId } from '@tests/back/scene/flight/camera.cases';

export const caseTest = (id: CameraCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
