import type { Page } from '@playwright/test';

const EVENT_NAME = 'portfolio:analytics';
const STORE_KEY = '__e2eAnalytics';

export type CollectedEvent = Readonly<{ name: string; [key: string]: unknown }>;

export const collectAnalytics = async (page: Page): Promise<void> => {
  await page.addInitScript(
    ([eventName, storeKey]: readonly [string, string]) => {
      const store: unknown[] = [];

      Reflect.set(window, storeKey, store);

      window.addEventListener(eventName, (event: Event) => {
        if (event instanceof CustomEvent) {
          store.push(event.detail);
        }
      });
    },
    [EVENT_NAME, STORE_KEY] as const,
  );
};

export const readAnalytics = async (page: Page): Promise<CollectedEvent[]> => {
  const raw: unknown[] = await page.evaluate((storeKey: string) => {
    const value: unknown = Reflect.get(window, storeKey);

    return Array.isArray(value) ? [...value] : [];
  }, STORE_KEY);

  return raw.filter((entry): entry is CollectedEvent => {
    return typeof entry === 'object' && entry !== null && 'name' in entry;
  });
};
