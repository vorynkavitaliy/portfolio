import { afterEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/contact/contact.case-test';
import { CONTACT_FORM_COPY } from '@/content/contact-form.content';
import { ContactForm } from '@/sections/contact/contact-form.client';

import type { ContactFormState } from '@/sections/contact/contact.types';

type FakeAction = (previous: ContactFormState, formData: FormData) => Promise<ContactFormState>;

type RenderOptions = Readonly<{
  sitekey: string;
  action: string;
  appearance: string;
  'response-field': boolean;
  callback: (token: string) => void;
}>;

type FakeTurnstile = Readonly<{
  renders: Array<Readonly<{ container: HTMLElement; options: RenderOptions }>>;
  resets: string[];
  api: Readonly<{
    render: (container: HTMLElement, options: RenderOptions) => string;
    reset: (id: string) => void;
    remove: (id: string) => void;
  }>;
}>;

const SITE_KEY = '1x00000000000000000000BB';
const WIDGET_ID = 'cf-widget-1';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const VALID = {
  name: 'Ada Lovelace',
  email: 'ada@example.test',
  message: 'Hello there, this is long enough.',
} as const;

const installTurnstile = (): FakeTurnstile => {
  const renders: Array<Readonly<{ container: HTMLElement; options: RenderOptions }>> = [];
  const resets: string[] = [];

  const api = {
    render: (container: HTMLElement, options: RenderOptions) => {
      renders.push({ container, options });

      return WIDGET_ID;
    },
    reset: (id: string) => {
      resets.push(id);
    },
    remove: () => {},
  };

  Reflect.set(window, 'turnstile', api);

  return { renders, resets, api };
};

const issueToken = (fake: FakeTurnstile, token: string): void => {
  const last = fake.renders.at(-1);

  last?.options.callback(token);
};

afterEach(() => {
  Reflect.deleteProperty(window, 'turnstile');
  vi.restoreAllMocks();
});

const answering = () => {
  return vi.fn<FakeAction>(() => {
    return Promise.resolve({ status: 'idle' });
  });
};

const mountForm = async (action: FakeAction, siteKey: string | null) => {
  const screen = await render(
    <ContactForm action={action} copy={CONTACT_FORM_COPY} turnstileSiteKey={siteKey} />,
  );

  return {
    screen,
    name: screen.getByRole('textbox', { name: 'Name', exact: true }),
    email: screen.getByRole('textbox', { name: 'Email', exact: true }),
    message: screen.getByRole('textbox', { name: 'Message', exact: true }),
    submit: screen.getByRole('button', { name: 'Send message', exact: true }),
  };
};

const fillValid = async (form: Awaited<ReturnType<typeof mountForm>>): Promise<void> => {
  await form.name.fill(VALID.name);
  await form.email.fill(VALID.email);
  await form.message.fill(VALID.message);
};

const turnstileScripts = (): HTMLScriptElement[] => {
  return [...document.querySelectorAll('script')].filter((script: HTMLScriptElement) => {
    return script.src.includes('challenges.cloudflare.com');
  });
};

const sentToken = (action: ReturnType<typeof answering>, call: number): unknown => {
  return action.mock.calls[call]?.[1].get('cf-turnstile-response');
};

caseTest('contact-form.turnstile-lazy', 'nothing before the first interaction', async () => {
  const fake = installTurnstile();
  const form = await mountForm(answering(), SITE_KEY);

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 150);
  });

  expect(turnstileScripts()).toEqual([]);
  expect(fake.renders).toEqual([]);

  await form.name.click();

  await expect
    .poll(() => {
      return fake.renders.length;
    })
    .toBe(1);
});

caseTest(
  'contact-form.turnstile-render',
  'explicit render with the documented options',
  async () => {
    const fake = installTurnstile();
    const form = await mountForm(answering(), SITE_KEY);

    await form.name.click();
    await form.email.click();

    await expect
      .poll(() => {
        return fake.renders.length;
      })
      .toBe(1);

    await form.message.click();
    expect(fake.renders).toHaveLength(1);

    const [first] = fake.renders;

    expect(first?.container.closest('form')).toBe(form.screen.container.querySelector('form'));

    expect(first?.options).toMatchObject({
      sitekey: SITE_KEY,
      action: 'contact',
      appearance: 'interaction-only',
      'response-field': false,
    });
  },
);

caseTest('contact-form.turnstile-token', 'token in FormData, reset after submit', async () => {
  const fake = installTurnstile();
  const action = answering();
  const form = await mountForm(action, SITE_KEY);

  await fillValid(form);

  await expect
    .poll(() => {
      return fake.renders.length;
    })
    .toBe(1);

  issueToken(fake, 'token-one');
  await form.submit.click();

  await expect
    .poll(() => {
      return action.mock.calls.length;
    })
    .toBe(1);

  expect(sentToken(action, 0)).toBe('token-one');
  expect(fake.resets).toEqual([WIDGET_ID]);

  await form.submit.click();

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 200);
  });

  expect(action.mock.calls).toHaveLength(1);

  issueToken(fake, 'token-two');

  await expect
    .poll(() => {
      return action.mock.calls.length;
    })
    .toBe(2);

  expect(sentToken(action, 1)).toBe('token-two');
  expect(fake.resets).toEqual([WIDGET_ID, WIDGET_ID]);
});

caseTest('contact-form.turnstile-waits', 'submit waits for the callback', async () => {
  const fake = installTurnstile();
  const action = answering();
  const form = await mountForm(action, SITE_KEY);

  await fillValid(form);
  await form.submit.click();

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 200);
  });

  expect(action).not.toHaveBeenCalled();

  issueToken(fake, 'late-token');

  await expect
    .poll(() => {
      return action.mock.calls.length;
    })
    .toBe(1);

  expect(sentToken(action, 0)).toBe('late-token');
});

caseTest('contact-form.turnstile-no-key', 'no key, no widget, empty token', async () => {
  const fake = installTurnstile();
  const action = answering();
  const form = await mountForm(action, null);

  await fillValid(form);
  await form.submit.click();

  await expect
    .poll(() => {
      return action.mock.calls.length;
    })
    .toBe(1);

  expect(sentToken(action, 0)).toBe('');
  expect(fake.renders).toEqual([]);
  expect(turnstileScripts()).toEqual([]);
});

caseTest(
  'contact-form.turnstile-script',
  'one lazy script; a failed load still submits',
  async () => {
    const appended: Node[] = [];

    vi.spyOn(document.head, 'append').mockImplementation((...nodes: Array<Node | string>) => {
      for (const node of nodes) {
        if (typeof node !== 'string') {
          appended.push(node);
        }
      }
    });

    const action = answering();
    const form = await mountForm(action, SITE_KEY);

    expect(appended).toEqual([]);

    await form.name.click();

    await expect
      .poll(() => {
        return appended.length;
      })
      .toBe(1);

    await form.email.click();
    expect(appended).toHaveLength(1);

    const [script] = appended;

    expect(script).toBeInstanceOf(HTMLScriptElement);
    expect(script instanceof HTMLScriptElement ? script.src : '').toBe(SCRIPT_URL);
    expect(script instanceof HTMLScriptElement ? script.async : false).toBe(true);

    script?.dispatchEvent(new Event('error'));

    await fillValid(form);
    await form.submit.click();

    await expect
      .poll(() => {
        return action.mock.calls.length;
      })
      .toBe(1);

    expect(sentToken(action, 0)).toBe('');
  },
);
