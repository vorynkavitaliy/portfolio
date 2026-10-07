import AxeBuilder from '@axe-core/playwright';
import { expect, test as base } from '@playwright/test';

import { collectAnalytics, readAnalytics } from '@tests/front/e2e/support/analytics';
import { startServerWith } from '@tests/front/e2e/contact-form.server';
import {
  CLIENT_IP_HEADER,
  CONTACT_FROM,
  CONTACT_TO,
  TURNSTILE_TEST_SECRET_FAIL,
} from '@tests/front/e2e/support/e2e-env';
import { searchMessages, waitForMessages } from '@tests/front/e2e/support/mail-sink';

import type { ExtraServer } from '@tests/front/e2e/contact-form.server';
import type { Locator, Page, TestInfo } from '@playwright/test';

const FORM_URL = '/#text';
const MIN_FILL_MS = 3000;
const FILL_MARGIN_MS = 300;
const COPIED_RESET_MS = 1600;
const SUBJECT_PREFIX = 'Portfolio contact:';
const STATUS_SENT = 'Message sent. A reply comes by email.';
const STATUS_INVALID = 'Message not sent. Check the marked fields.';

const STATUS_RATE_LIMITED =
  'Message not sent. Too many messages. Wait a few minutes and try again.';

const STATUS_VERIFICATION_FAILED =
  'Message not sent. The spam check did not pass. Write to the email address above.';

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

const ERROR_NAME = 'Enter your name.';
const ERROR_EMAIL = 'Enter a valid email, like name@company.com.';
const ERROR_MESSAGE = 'Write at least 10 characters.';

let ipCounter = 0;

const freshIp = (): string => {
  ipCounter += 1;

  const stamp: number = Date.now() % 250;
  const random: number = Math.floor(Math.random() * 250);

  return `10.${stamp}.${random}.${(ipCounter % 250) + 1}`;
};

const freshToken = (): string => {
  return `tk${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

const test = base.extend<{ clientIp: string; pageWithClipboard: Page }>({
  clientIp: async ({}, provide) => {
    await provide(freshIp());
  },
  extraHTTPHeaders: async ({ clientIp }, provide) => {
    await provide({ [CLIENT_IP_HEADER]: clientIp });
  },
  pageWithClipboard: async ({ browser }, provide, info) => {
    const shouldSkip = info.project.name !== 'desktop-1440';
    test.skip(shouldSkip, 'clipboard permission only supported on desktop chromium');

    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write'],
    });

    const page = await context.newPage();
    await provide(page);
    await context.close();
  },
});

const onlyDesktop = (info: TestInfo): void => {
  test.skip(info.project.name !== 'desktop-1440', 'runs in desktop-1440 only');
};

const field = (page: Page, name: 'name' | 'email' | 'message'): Locator => {
  return page.locator(`#f-${name}`);
};

const startedAtInput = (page: Page): Locator => {
  return page.locator('input[name="startedAt"]');
};

const submitButton = (page: Page): Locator => {
  return page.locator('[data-contact-form] button[type="submit"]');
};

const status = (page: Page): Locator => {
  return page.locator('#status');
};

const openForm = async (page: Page): Promise<void> => {
  await page.goto(FORM_URL);
  await expect(startedAtInput(page)).toHaveValue(/^\d+$/);
};

const waitMinimumFill = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    ([minimum, margin]) => {
      const input = document.querySelector('input[name="startedAt"]');

      return (
        input instanceof HTMLInputElement &&
        Date.now() - Number(input.value) > Number(minimum) + Number(margin)
      );
    },
    [MIN_FILL_MS, FILL_MARGIN_MS] as const,
  );
};

const fillForm = async (
  page: Page,
  values: Readonly<{ name: string; email: string; message: string }>,
): Promise<void> => {
  await field(page, 'name').fill(values.name);
  await field(page, 'email').fill(values.email);
  await field(page, 'message').fill(values.message);
};

const collectContactPosts = (page: Page): string[] => {
  const posts: string[] = [];

  page.on('request', (request) => {
    if (request.method() === 'POST' && !request.url().startsWith(TURNSTILE_ORIGIN)) {
      posts.push(request.url());
    }
  });

  return posts;
};

test.describe('server HTML', () => {
  test.use({ javaScriptEnabled: false });

  test('sec.contact.server-html: fields, honeypot, startedAt and limits render without JavaScript', async ({
    page,
  }, info) => {
    onlyDesktop(info);
    await page.goto(FORM_URL);

    await expect(field(page, 'name')).toHaveAttribute('maxlength', '80');
    await expect(field(page, 'email')).toHaveAttribute('maxlength', '254');
    await expect(field(page, 'message')).toHaveAttribute('maxlength', '4000');
    await expect(startedAtInput(page)).toHaveValue('');
    await expect(startedAtInput(page)).toHaveAttribute('type', 'hidden');

    const honeypot: Locator = page.locator('.hp[aria-hidden="true"]');

    await expect(honeypot).toHaveCount(1);
    await expect(honeypot.locator('input[name="website"]')).toHaveAttribute('tabindex', '-1');
    await expect(honeypot.locator('input[name="website"]')).toHaveAttribute('autocomplete', 'off');

    const box = await honeypot.boundingBox();

    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThan(0);
  });

  test('sec.contact.no-js: a plain POST has no Turnstile token, shows the direct-email status and sends nothing', async ({
    page,
  }, info) => {
    onlyDesktop(info);

    const token: string = freshToken();

    await page.goto(FORM_URL);

    await fillForm(page, {
      name: 'No Script',
      email: 'noscript@visitor.test',
      message: `No JavaScript message ${token}`,
    });

    await submitButton(page).click();

    await expect(status(page)).toHaveText(STATUS_VERIFICATION_FAILED);
    await page.waitForTimeout(1000);
    expect(await searchMessages(token)).toEqual([]);
  });
});

test('sec.contact.turnstile-lazy: no Turnstile request before the first form interaction', async ({
  page,
}, info) => {
  onlyDesktop(info);

  const turnstileRequests: string[] = [];

  page.on('request', (request) => {
    if (request.url().startsWith(TURNSTILE_ORIGIN)) {
      turnstileRequests.push(request.url());
    }
  });

  await openForm(page);
  await page.waitForTimeout(1500);
  expect(turnstileRequests).toEqual([]);

  await field(page, 'name').focus();

  await expect
    .poll(() => {
      return turnstileRequests[0];
    })
    .toBe(`${TURNSTILE_ORIGIN}/turnstile/v0/api.js?render=explicit`);
});

test('sec.contact.csp-turnstile: the policy allows Turnstile scripts and frames only from its origin', async ({
  request,
}, info) => {
  onlyDesktop(info);

  const response = await request.get('/');
  const policy: string[] = (response.headers()['content-security-policy'] ?? '').split('; ');

  const scriptSrc: string[] = (
    policy.find((directive: string) => {
      return directive.startsWith('script-src ');
    }) ?? ''
  ).split(' ');

  expect(scriptSrc).toContain(TURNSTILE_ORIGIN);
  expect(scriptSrc).toContain("'strict-dynamic'");
  expect(policy).toContain(`frame-src ${TURNSTILE_ORIGIN}`);
  expect(policy).toContain("connect-src 'self'");
});

test('sec.contact.turnstile-missing: a blocked Turnstile script still submits, shows the direct-email status and sends nothing', async ({
  page,
}, info) => {
  onlyDesktop(info);

  const token: string = freshToken();

  await page.route(`${TURNSTILE_ORIGIN}/**`, async (route) => {
    await route.abort();
  });

  await openForm(page);
  await waitMinimumFill(page);

  await fillForm(page, {
    name: 'Blocked Script',
    email: 'blocked@visitor.test',
    message: `Turnstile could not load ${token}`,
  });

  await submitButton(page).click();

  await expect(status(page)).toHaveText(STATUS_VERIFICATION_FAILED);
  await expect(field(page, 'name')).toHaveValue('Blocked Script');
  await page.waitForTimeout(1000);
  expect(await searchMessages(token)).toEqual([]);
});

test.describe('always-fail Turnstile secret', () => {
  let failing: ExtraServer | null = null;

  test.beforeAll(async ({}, info) => {
    if (info.project.name === 'desktop-1440') {
      failing = await startServerWith({ TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET_FAIL });
    }
  });

  test.afterAll(async () => {
    await failing?.stop();
  });

  test('sec.contact.turnstile-rejected: the always-fail test secret gives the direct-email status and no mail', async ({
    page,
  }, info) => {
    onlyDesktop(info);

    const token: string = freshToken();

    await page.goto(`${failing?.baseURL ?? ''}${FORM_URL}`);
    await expect(startedAtInput(page)).toHaveValue(/^\d+$/);
    await waitMinimumFill(page);

    await fillForm(page, {
      name: 'Rejected Token',
      email: 'rejected@visitor.test',
      message: `Always-fail secret ${token}`,
    });

    await submitButton(page).click();

    await expect(status(page)).toHaveText(STATUS_VERIFICATION_FAILED);
    await page.waitForTimeout(1000);
    expect(await searchMessages(token)).toEqual([]);
  });
});

test('sec.contact.valid-send: one mail with fixed envelope, text body only, analytics once', async ({
  page,
}, info) => {
  onlyDesktop(info);

  const token: string = freshToken();
  const message = `Hello from the e2e suite ${token}`;

  await collectAnalytics(page);
  await openForm(page);
  await waitMinimumFill(page);

  await fillForm(page, { name: '  Ada Lovelace  ', email: 'ada@visitor.test', message });
  await submitButton(page).click();

  await expect(status(page)).toHaveText(STATUS_SENT);
  await expect(field(page, 'name')).toHaveValue('');

  const messages = await waitForMessages(token, 1);

  expect(messages).toHaveLength(1);

  const [mail] = messages;

  expect(mail?.from).toBe(CONTACT_FROM);
  expect(mail?.to).toEqual([CONTACT_TO]);
  expect(mail?.replyTo).toEqual(['ada@visitor.test']);
  expect(mail?.subject).toBe(`${SUBJECT_PREFIX} Ada Lovelace`);

  expect(mail?.text.replace(/\r\n/g, '\n').trim()).toBe(
    `Name: Ada Lovelace\nEmail: ada@visitor.test\n\n${message}`,
  );

  expect(mail?.html).toBe('');

  const sent = (await readAnalytics(page)).filter((event) => {
    return event.name === 'contact_sent';
  });

  expect(sent).toHaveLength(1);
});

test('sec.contact.empty: field errors, aria-invalid, focus on Name, no request', async ({
  page,
}, info) => {
  onlyDesktop(info);
  await openForm(page);

  const posts: string[] = collectContactPosts(page);

  await submitButton(page).click();

  await expect(page.locator('#e-name')).toHaveText(ERROR_NAME);
  await expect(page.locator('#e-email')).toHaveText(ERROR_EMAIL);
  await expect(page.locator('#e-message')).toHaveText(ERROR_MESSAGE);
  await expect(status(page)).toHaveText(STATUS_INVALID);

  for (const name of ['name', 'email', 'message'] as const) {
    await expect(field(page, name)).toHaveAttribute('aria-invalid', 'true');
  }

  await expect(field(page, 'name')).toBeFocused();
  expect(posts).toEqual([]);
});

test('sec.contact.short-message: only the message is flagged and focused', async ({
  page,
}, info) => {
  onlyDesktop(info);
  await openForm(page);

  const posts: string[] = collectContactPosts(page);

  await fillForm(page, { name: 'Ann', email: 'ann@visitor.test', message: 'short' });
  await submitButton(page).click();

  await expect(page.locator('#e-message')).toHaveText(ERROR_MESSAGE);
  await expect(page.locator('#e-name')).toHaveText('');
  await expect(page.locator('#e-email')).toHaveText('');
  await expect(field(page, 'message')).toBeFocused();
  expect(posts).toEqual([]);
});

test('sec.contact.crlf-email: a header-injection email is a field error and sends nothing', async ({
  page,
}, info) => {
  onlyDesktop(info);

  const token: string = freshToken();

  await openForm(page);
  await waitMinimumFill(page);

  await fillForm(page, {
    name: 'Mallory',
    email: 'mallory@visitor.test\r\nBcc: x@evil.test',
    message: `Injection attempt through email ${token}`,
  });

  await submitButton(page).click();

  await expect(page.locator('#e-email')).toHaveText(ERROR_EMAIL);
  await expect(field(page, 'email')).toHaveAttribute('aria-invalid', 'true');
  await expect(field(page, 'email')).toBeFocused();
  expect(await searchMessages(token)).toEqual([]);
});

test('sec.contact.crlf-name: CRLF in the name cannot add a recipient or a subject line', async ({
  page,
}, info) => {
  onlyDesktop(info);

  const token: string = freshToken();

  await openForm(page);
  await waitMinimumFill(page);

  await fillForm(page, {
    name: 'Ann\r\nBcc: x@evil.test',
    email: 'ann@visitor.test',
    message: `Injection attempt through name ${token}`,
  });

  await submitButton(page).click();
  await expect(status(page)).toHaveText(STATUS_SENT);

  const messages = await waitForMessages(token, 1);

  expect(messages).toHaveLength(1);
  expect(messages[0]?.subject).toMatch(/^Portfolio contact: Ann ?Bcc: x@evil\.test$/);
  expect(messages[0]?.to).toEqual([CONTACT_TO]);
  expect(messages[0]?.subject).not.toMatch(/[\r\n]/);

  const full = await fetch(
    `http://127.0.0.1:8025/api/v1/message/${encodeURIComponent(messages[0]?.id ?? '')}`,
  ).then(async (response) => {
    return response.json() as Promise<{ Bcc: unknown[] | null }>;
  });

  expect(full.Bcc ?? []).toEqual([]);
});

test('sec.contact.burst: the 4th send from one IP is rate limited and values are kept', async ({
  page,
}, info) => {
  onlyDesktop(info);

  const token: string = freshToken();

  await openForm(page);
  await waitMinimumFill(page);

  for (const index of [1, 2, 3]) {
    await fillForm(page, {
      name: 'Burst',
      email: 'burst@visitor.test',
      message: `Burst message number ${index} ${token}`,
    });

    await submitButton(page).click();
    await expect(status(page)).toHaveText(STATUS_SENT);
    await expect(field(page, 'name')).toHaveValue('');
    await expect(submitButton(page)).toBeEnabled();

    if (index < 3) {
      await page.locator('body').click({ position: { x: 1, y: 1 } });
    }
  }

  const fourth = `Burst message number 4 ${token}`;

  await fillForm(page, { name: 'Burst', email: 'burst@visitor.test', message: fourth });
  await submitButton(page).click();

  await expect(status(page)).toHaveText(STATUS_RATE_LIMITED);
  await expect(field(page, 'name')).toHaveValue('Burst');
  await expect(field(page, 'email')).toHaveValue('burst@visitor.test');
  await expect(field(page, 'message')).toHaveValue(fourth);

  const messages = await waitForMessages(token, 3);

  await page.waitForTimeout(500);
  expect(await searchMessages(token)).toHaveLength(3);
  expect(messages.length).toBeGreaterThanOrEqual(3);
});

test('sec.contact.honeypot: a filled honeypot shows success and sends nothing', async ({
  page,
}, info) => {
  onlyDesktop(info);

  const token: string = freshToken();

  await openForm(page);
  await waitMinimumFill(page);

  await fillForm(page, {
    name: 'Robot',
    email: 'robot@visitor.test',
    message: `Honeypot filled ${token}`,
  });

  await page.locator('#f-website').fill('https://spam.test', { force: true });
  await submitButton(page).click();

  await expect(status(page)).toHaveText(STATUS_SENT);
  await page.waitForTimeout(1000);
  expect(await searchMessages(token)).toEqual([]);
});

test('sec.contact.fill-time: a submit under 3 s after hydration shows success and sends nothing', async ({
  page,
}, info) => {
  onlyDesktop(info);

  const token: string = freshToken();

  await openForm(page);

  const startedAt = Number(await startedAtInput(page).inputValue());

  await fillForm(page, {
    name: 'Speedy',
    email: 'speedy@visitor.test',
    message: `Too fast to be human ${token}`,
  });

  await submitButton(page).click();

  expect(Date.now() - startedAt).toBeLessThan(MIN_FILL_MS);

  await expect(status(page)).toHaveText(STATUS_SENT);
  await page.waitForTimeout(1000);
  expect(await searchMessages(token)).toEqual([]);
});

test.describe('copy email', () => {
  test('sec.contact.copy: the button reads Copied, reverts, and tracks email_copy once', async ({
    pageWithClipboard,
  }) => {
    const page = pageWithClipboard;

    await collectAnalytics(page);
    await openForm(page);

    const button: Locator = page.locator('[data-copy-email]');

    await expect(button).toHaveText('Copy');
    await button.click();
    await expect(button).toHaveText('Copied');
    await expect(button).toHaveText('Copy', { timeout: COPIED_RESET_MS * 3 });

    const copied = (await readAnalytics(page)).filter((event) => {
      return event.name === 'email_copy';
    });

    expect(copied).toHaveLength(1);
  });
});

test('sec.contact.tab-order: Name, Email, Message, Send; the honeypot is skipped', async ({
  page,
}, info) => {
  onlyDesktop(info);
  await openForm(page);

  await field(page, 'name').focus();
  await page.keyboard.press('Tab');
  await expect(field(page, 'email')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(field(page, 'message')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(submitButton(page)).toBeFocused();
});

test('sec.contact.axe: the contact form has no axe violations', async ({ page }, info) => {
  onlyDesktop(info);
  await openForm(page);

  const results = await new AxeBuilder({ page }).include('[data-contact-form]').analyze();

  expect(results.violations).toEqual([]);
});
