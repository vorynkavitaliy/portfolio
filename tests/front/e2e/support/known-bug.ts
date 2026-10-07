import { expect } from '@playwright/test';

export const expectKnownBug = async (bugId: string, check: () => Promise<void>): Promise<void> => {
  let failed = false;

  try {
    await check();
  } catch {
    failed = true;
  }

  expect(
    failed,
    `known bug ${bugId} no longer reproduces: make it a plain assertion and update the catalogue`,
  ).toBe(true);
};
