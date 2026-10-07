import { expect, test } from '@playwright/test';

import { MAIL_INFO_URL } from '@tests/front/e2e/support/e2e-env';

import type { EnvironmentCaseId } from '@tests/front/e2e/environment.cases';
import type { Page, TestInfo } from '@playwright/test';

const caseTitle = (id: EnvironmentCaseId, description: string): string => {
  return `${id}: ${description}`;
};

const hasWebGl2 = async (page: Page): Promise<boolean> => {
  return page.evaluate(() => {
    return document.createElement('canvas').getContext('webgl2') !== null;
  });
};

const onlyProject = (info: TestInfo, name: string): void => {
  test.skip(info.project.name !== name, `runs in ${name} only`);
};

test(caseTitle('env.webgl2.desktop-1440', 'WebGL2 is available'), async ({ page }, info) => {
  onlyProject(info, 'desktop-1440');
  await page.goto('/');

  expect(await hasWebGl2(page)).toBe(true);
});

test(caseTitle('env.webgl2.reduced-motion', 'WebGL2 is available'), async ({ page }, info) => {
  onlyProject(info, 'reduced-motion');
  await page.goto('/');

  expect(await hasWebGl2(page)).toBe(true);
});

test(caseTitle('env.webgl2.mobile-390', 'WebGL2 is available'), async ({ page }, info) => {
  onlyProject(info, 'mobile-390');
  await page.goto('/');

  expect(await hasWebGl2(page)).toBe(true);
});

test(
  caseTitle('env.pointer.coarse-mobile-390', 'the pointer is coarse'),
  async ({ page }, info) => {
    onlyProject(info, 'mobile-390');
    await page.goto('/');

    expect(
      await page.evaluate(() => {
        return window.matchMedia('(pointer: coarse)').matches;
      }),
    ).toBe(true);
  },
);

test(caseTitle('env.mailpit.answers', 'the API answers'), async ({ request }, info) => {
  onlyProject(info, 'desktop-1440');
  const response = await request.get(MAIL_INFO_URL);

  expect(response.status()).toBe(200);
});
