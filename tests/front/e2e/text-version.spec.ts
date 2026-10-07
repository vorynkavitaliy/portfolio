import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { CONTACT_FORM_COPY } from '@/content/contact-form.content';
import { WORLD_COPY } from '@/content/world.content';

import type { TextVersionCaseId } from '@tests/front/e2e/text-version.cases';
import type { Page } from '@playwright/test';

const caseTitle = (id: TextVersionCaseId, description: string): string => {
  return `${id}: ${description}`;
};

const SPEC_STATION_ORDER: readonly string[] = [
  'home-base',
  'llm-product',
  'marketplace-chat',
  'admin-app',
  'ai-engineering',
  'systems',
  'flight-log',
  'this-world',
  'contact',
];

const MAX_TABS = 120;
const SETTLE_MS = 500;

const LOW_END_DEVICE_MEMORY_GB = 2;

const openTextByDefault = async (page: Page): Promise<void> => {
  await page.addInitScript((memory: number) => {
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => {
        return memory;
      },
    });
  }, LOW_END_DEVICE_MEMORY_GB);

  await page.goto('/');
  await hydrated(page);
  await expect(page.locator('[data-view="text"]')).toBeVisible();
};

const hydrated = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => {
    return 'next' in window;
  });
};

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test(caseTitle('spec.text.nojs-structure', 'full text version'), async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    const ids: string[] = await page.locator('section[data-station]').evaluateAll((nodes) => {
      return nodes.map((node) => {
        return node.getAttribute('data-station') ?? '';
      });
    });

    expect(ids).toEqual(SPEC_STATION_ORDER);

    for (const id of SPEC_STATION_ORDER) {
      await expect(page.locator(`section[data-station="${id}"] :is(h1, h2)`)).toHaveCount(1);
    }

    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('[data-loader]')).toBeHidden();
    await expect(page.getByRole('button', { name: WORLD_COPY.header.autopilot })).toHaveCount(0);
    await expect(page.getByRole('button', { name: WORLD_COPY.header.toWorld })).toHaveCount(0);
  });

  test(caseTitle('sec.nojs.text-visible-at-t0', 'visible at once'), async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });

    await expect(page.locator('#text')).toBeVisible();

    const display: string = await page.locator('[data-loader]').evaluate((node) => {
      return getComputedStyle(node).display;
    });

    expect(display).toBe('none');
  });
});

test(caseTitle('spec.text.deep-link-no-loader', 'loader never visible'), async ({ page }) => {
  await page.addInitScript(() => {
    const seen: string[] = [];

    Object.defineProperty(window, '__loaderSeen', { value: seen });

    const sample = (): void => {
      const node = document.querySelector('[data-loader]');

      if (node !== null) {
        const style = getComputedStyle(node);

        seen.push(
          `${document.readyState}:${style.display !== 'none' && style.visibility !== 'hidden'}`,
        );
      }

      requestAnimationFrame(sample);
    };

    requestAnimationFrame(sample);
  });

  await page.goto('/#text');
  await hydrated(page);
  await page.waitForTimeout(SETTLE_MS);

  const seen: unknown = await page.evaluate(() => {
    return Reflect.get(window, '__loaderSeen');
  });

  const samples: string[] = Array.isArray(seen) ? seen.map(String) : [];

  const afterParse: string[] = samples.filter((sample) => {
    return !sample.startsWith('loading:');
  });

  expect(afterParse.length).toBeGreaterThan(0);
  expect(afterParse).not.toContain('interactive:true');
  expect(afterParse).not.toContain('complete:true');

  await expect(page.locator('#text')).toBeVisible();
});

test(caseTitle('spec.text.focus-order', 'brand then toggle'), async ({ page }, info) => {
  test.skip(info.project.name === 'no-webgl', 'no world toggle without WebGL2');
  test.skip(info.project.name === 'mobile-390', 'Tab order is checked on the desktop projects');

  await openTextByDefault(page);
  await expect(page.getByRole('button', { name: WORLD_COPY.header.toWorld })).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: WORLD_COPY.header.brand })).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: WORLD_COPY.header.toWorld })).toBeFocused();
});

test(caseTitle('spec.text.brand-first-no-toggle', 'brand only'), async ({ page }, info) => {
  test.skip(info.project.name !== 'no-webgl', 'applies without WebGL2');

  await page.goto('/');
  await hydrated(page);
  await expect(page.locator('[data-view="text"]')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: WORLD_COPY.header.brand })).toBeFocused();
  await expect(page.getByRole('button', { name: WORLD_COPY.header.toWorld })).toHaveCount(0);
});

test(caseTitle('spec.text.no-horizontal-scroll', 'fits 390 px'), async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-390', 'applies to mobile-390 only');

  await page.goto('/#text');
  await hydrated(page);

  const overflow: number = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });

  expect(overflow).toBeLessThanOrEqual(0);
});

test(caseTitle('wcag.axe.text-version', 'no violations'), async ({ page }) => {
  await page.goto('/#text');
  await hydrated(page);

  const result = await new AxeBuilder({ page }).analyze();

  expect(result.violations).toEqual([]);
});

test(
  caseTitle('wcag.keyboard.text-walk', 'reaches submit, focus visible'),
  async ({ page }, info) => {
    test.skip(info.project.name === 'mobile-390', 'Tab order is checked on the desktop projects');

    if (info.project.name === 'no-webgl') {
      await page.goto('/');
      await hydrated(page);
      await expect(page.locator('[data-view="text"]')).toBeVisible();
    } else {
      await openTextByDefault(page);
    }

    const missing: string[] = [];
    let reachedSubmit = false;

    for (let step = 0; step < MAX_TABS && !reachedSubmit; step += 1) {
      await page.keyboard.press('Tab');

      const state = await page.evaluate((submitLabel: string) => {
        const node = document.activeElement;

        if (node === null || node === document.body) {
          return { label: '', outlined: false, submit: false };
        }

        const style = getComputedStyle(node);

        const look = (target: Element): string => {
          const computed = getComputedStyle(target);

          return `${computed.boxShadow}|${computed.borderTopColor}|${computed.backgroundColor}`;
        };

        const focusedLook: string = look(node);

        const outlined: boolean =
          style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;

        if (node instanceof HTMLElement) {
          node.blur();
        }

        const restLook: string = look(node);

        if (node instanceof HTMLElement) {
          node.focus();
        }

        return {
          label: `${node.tagName.toLowerCase()} ${(node.textContent ?? '').trim().slice(0, 30)}`,
          outlined: outlined || focusedLook !== restLook,
          submit: node.tagName === 'BUTTON' && (node.textContent ?? '').trim() === submitLabel,
        };
      }, CONTACT_FORM_COPY.submit);

      if (!state.outlined) {
        missing.push(state.label);
      }

      reachedSubmit = state.submit;
    }

    expect(reachedSubmit).toBe(true);

    expect(
      missing.filter((label) => {
        return !label.startsWith('input') && !label.startsWith('textarea');
      }),
    ).toEqual([]);
  },
);
