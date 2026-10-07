import { afterEach, beforeEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/contact/contact.case-test';
import { ANALYTICS_EVENT } from '@/core/analytics/analytics';
import { CONTACT_FORM_COPY } from '@/content/contact-form.content';
import { STATIONS_COPY } from '@/content/stations.content';
import { worldStore } from '@/core/world/world-store';
import { ContactForm } from '@/sections/contact/contact-form.client';
import { CopyEmail } from '@/sections/contact/copy-email.client';

import type { ContactFormState } from '@/sections/contact/contact.types';

type FakeAction = (previous: ContactFormState, formData: FormData) => Promise<ContactFormState>;

const EMAIL: string = STATIONS_COPY.contact.email;
const COPY_LABELS = STATIONS_COPY.contact.copy;

let details: unknown[];
let dispatchSpy: ReturnType<typeof vi.spyOn>;

const recordEvent = (event: Event): void => {
  details.push(event instanceof CustomEvent ? event.detail : undefined);
};

beforeEach(() => {
  details = [];
  window.addEventListener(ANALYTICS_EVENT, recordEvent);
  dispatchSpy = vi.spyOn(worldStore, 'dispatch');
});

afterEach(() => {
  window.removeEventListener(ANALYTICS_EVENT, recordEvent);
  dispatchSpy.mockRestore();
  vi.restoreAllMocks();
});

const settle = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 150);
  });
};

const answering = (state: ContactFormState) => {
  return vi.fn<FakeAction>(() => {
    return Promise.resolve(state);
  });
};

const mountForm = async (action: FakeAction) => {
  const screen = await render(<ContactForm action={action} copy={CONTACT_FORM_COPY} />);

  return {
    screen,
    name: screen.getByRole('textbox', { name: 'Name', exact: true }),
    email: screen.getByRole('textbox', { name: 'Email', exact: true }),
    message: screen.getByRole('textbox', { name: 'Message', exact: true }),
    submit: screen.getByRole('button', { name: 'Send message', exact: true }),
    status: screen.getByRole('status'),
  };
};

const VALID = {
  name: 'Ada Lovelace',
  email: 'ada@example.test',
  message: 'Hello there, this is long enough.',
} as const;

const fillValid = async (form: Awaited<ReturnType<typeof mountForm>>): Promise<void> => {
  await form.name.fill(VALID.name);
  await form.email.fill(VALID.email);
  await form.message.fill(VALID.message);
};

caseTest('contact-form.limits', 'maxlength on the three inputs', async () => {
  const form = await mountForm(answering({ status: 'idle' }));

  await expect.element(form.name).toHaveAttribute('maxlength', '80');
  await expect.element(form.email).toHaveAttribute('maxlength', '254');
  await expect.element(form.message).toHaveAttribute('maxlength', '4000');
});

caseTest('contact-form.honeypot', 'hidden, unfocusable website field', async () => {
  const form = await mountForm(answering({ status: 'idle' }));
  const input = form.screen.container.querySelector<HTMLInputElement>('input[name="website"]');

  expect(input).not.toBeNull();
  expect(input?.getAttribute('tabindex')).toBe('-1');
  expect(input?.getAttribute('autocomplete')).toBe('off');
  expect(input?.closest('[aria-hidden="true"]')).not.toBeNull();
  expect(form.screen.getByRole('textbox', { name: 'Website' }).elements()).toEqual([]);
});

caseTest('contact-form.started-at-mount', 'set when interactive', async () => {
  const before: number = Date.now();
  const form = await mountForm(answering({ status: 'idle' }));
  const hidden = form.screen.container.querySelector<HTMLInputElement>('input[name="startedAt"]');

  await expect
    .poll(() => {
      return hidden?.value;
    })
    .toMatch(/^\d{13}$/);

  const stamped: number = Number(hidden?.value);

  expect(stamped).toBeGreaterThanOrEqual(before);
  expect(stamped).toBeLessThanOrEqual(Date.now());
});

caseTest('contact-form.empty-errors', 'exact copy, aria and no action call', async () => {
  const action = answering({ status: 'idle' });
  const form = await mountForm(action);

  await form.submit.click();

  const nameError = form.screen.getByText(CONTACT_FORM_COPY.errors.name, { exact: true });
  const emailError = form.screen.getByText(CONTACT_FORM_COPY.errors.email, { exact: true });
  const messageError = form.screen.getByText(CONTACT_FORM_COPY.errors.message, { exact: true });

  await expect.element(nameError).toHaveTextContent('Enter your name.');
  await expect.element(emailError).toHaveTextContent('Enter a valid email, like name@company.com.');
  await expect.element(messageError).toHaveTextContent('Write at least 10 characters.');
  await expect.element(form.name).toHaveAttribute('aria-invalid', 'true');
  await expect.element(form.email).toHaveAttribute('aria-invalid', 'true');
  await expect.element(form.message).toHaveAttribute('aria-invalid', 'true');
  await expect.element(form.name).toHaveAttribute('aria-describedby', 'e-name');
  await expect.element(form.email).toHaveAttribute('aria-describedby', 'e-email');
  await expect.element(form.message).toHaveAttribute('aria-describedby', 'e-message');
  expect(nameError.element().id).toBe('e-name');
  expect(emailError.element().id).toBe('e-email');
  expect(messageError.element().id).toBe('e-message');
  await expect.element(form.status).toHaveTextContent('Message not sent. Check the marked fields.');
  expect(action).not.toHaveBeenCalled();
});

caseTest('contact-form.focus-first-invalid', 'first invalid field is focused', async () => {
  const form = await mountForm(answering({ status: 'idle' }));

  await form.submit.click();
  await expect.element(form.name).toHaveFocus();

  await form.name.fill(VALID.name);
  await form.submit.click();
  await expect.element(form.email).toHaveFocus();

  await form.email.fill(VALID.email);
  await form.submit.click();
  await expect.element(form.message).toHaveFocus();
});

caseTest('contact-form.client-rules', 'shared schema rules', async () => {
  const action = answering({ status: 'idle' });
  const form = await mountForm(action);

  await form.name.fill(VALID.name);
  await form.email.fill('not-an-email');
  await form.message.fill('123456789');
  await form.submit.click();

  await expect.element(form.email).toHaveAttribute('aria-invalid', 'true');
  await expect.element(form.message).toHaveAttribute('aria-invalid', 'true');
  await expect.element(form.name).not.toHaveAttribute('aria-invalid');
  await expect.element(form.screen.getByText(CONTACT_FORM_COPY.errors.message)).toBeVisible();
  expect(action).not.toHaveBeenCalled();

  await form.email.fill(VALID.email);
  await form.message.fill('1234567890');
  await form.submit.click();

  await expect
    .poll(() => {
      return action.mock.calls.length;
    })
    .toBe(1);

  await expect.element(form.message).not.toHaveAttribute('aria-invalid');
});

caseTest('contact-form.valid-submit', 'action receives the typed values', async () => {
  const action = answering({ status: 'idle' });
  const form = await mountForm(action);

  await fillValid(form);
  await form.submit.click();

  await expect
    .poll(() => {
      return action.mock.calls.length;
    })
    .toBe(1);

  const sent: FormData | undefined = action.mock.calls[0]?.[1];

  expect(sent?.get('name')).toBe(VALID.name);
  expect(sent?.get('email')).toBe(VALID.email);
  expect(sent?.get('message')).toBe(VALID.message);
  expect(sent?.get('website')).toBe('');
});

caseTest('contact-form.pending', 'sending label and disabled', async () => {
  let release: () => void = () => {
    return undefined;
  };

  const action = vi.fn<FakeAction>(() => {
    return new Promise<ContactFormState>((resolve) => {
      release = () => {
        resolve({ status: 'idle' });
      };
    });
  });

  const form = await mountForm(action);

  await fillValid(form);
  await form.submit.click();

  try {
    await expect
      .element(form.screen.getByRole('button', { name: 'Sending…', exact: true }))
      .toBeDisabled();
  } finally {
    release();
  }

  await expect
    .element(form.screen.getByRole('button', { name: 'Send message', exact: true }))
    .toBeEnabled();
});

caseTest('contact-form.sent', 'success status, celebration, tracking', async () => {
  const form = await mountForm(answering({ status: 'sent' }));

  await fillValid(form);
  await form.submit.click();

  await expect.element(form.status).toHaveTextContent('Message sent. A reply comes by email.');

  await expect
    .poll(() => {
      return dispatchSpy.mock.calls;
    })
    .toEqual([[{ type: 'celebrate-send' }]]);

  await expect
    .poll(() => {
      return details;
    })
    .toEqual([{ name: 'contact_sent' }]);

  await settle();
  expect(dispatchSpy.mock.calls).toHaveLength(1);
  expect(details).toHaveLength(1);
});

caseTest('contact-form.not-sent-silent', 'failures never celebrate', async () => {
  const form = await mountForm(
    answering({ status: 'error', code: 'SEND_FAILED', fieldErrors: null }),
  );

  await form.submit.click();
  await fillValid(form);
  await form.submit.click();

  await expect.element(form.status).toHaveTextContent(CONTACT_FORM_COPY.status.sendFailed);
  await settle();
  expect(dispatchSpy).not.toHaveBeenCalled();
  expect(details).toEqual([]);
});

caseTest('contact-form.rate-limited', 'rate-limited status', async () => {
  const form = await mountForm(
    answering({ status: 'error', code: 'RATE_LIMITED', fieldErrors: null }),
  );

  await fillValid(form);
  await form.submit.click();

  await expect
    .element(form.status)
    .toHaveTextContent('Message not sent. Too many messages. Wait a few minutes and try again.');
});

caseTest('contact-form.send-failed', 'send-failed status', async () => {
  const form = await mountForm(
    answering({ status: 'error', code: 'SEND_FAILED', fieldErrors: null }),
  );

  await fillValid(form);
  await form.submit.click();

  await expect
    .element(form.status)
    .toHaveTextContent('Message not sent. Try again, or write to the email address above.');
});

caseTest('contact-form.server-field-errors', 'server errors shown and focused', async () => {
  const form = await mountForm(
    answering({
      status: 'error',
      code: 'INVALID_INPUT',
      fieldErrors: { email: 'Enter a valid email, like name@company.com.' },
    }),
  );

  await fillValid(form);
  await form.submit.click();

  await expect.element(form.email).toHaveAttribute('aria-invalid', 'true');
  await expect.element(form.email).toHaveFocus();
  await expect.element(form.name).not.toHaveAttribute('aria-invalid');
  await expect.element(form.status).toHaveTextContent('Message not sent. Check the marked fields.');

  await expect
    .element(form.screen.getByText('Enter a valid email, like name@company.com.', { exact: true }))
    .toBeVisible();
});

const ERROR_REPLIES: readonly ContactFormState[] = [
  { status: 'error', code: 'RATE_LIMITED', fieldErrors: null },
  { status: 'error', code: 'SEND_FAILED', fieldErrors: null },
  {
    status: 'error',
    code: 'INVALID_INPUT',
    fieldErrors: { email: 'Enter a valid email, like name@company.com.' },
  },
];

caseTest('contact-form.keeps-values-on-error', 'values survive every error reply', async () => {
  for (const reply of ERROR_REPLIES) {
    const form = await mountForm(answering(reply));

    await fillValid(form);
    await form.submit.click();
    await expect.element(form.status).not.toHaveTextContent('');
    await settle();

    expect(form.name.element()).toHaveProperty('value', VALID.name);
    expect(form.email.element()).toHaveProperty('value', VALID.email);
    expect(form.message.element()).toHaveProperty('value', VALID.message);

    if (reply.status === 'error' && reply.fieldErrors !== null) {
      await expect.element(form.email).toHaveFocus();
    }

    await form.screen.unmount();
  }
});

caseTest('contact-form.resets-on-sent', 'fields empty after sent', async () => {
  const form = await mountForm(answering({ status: 'sent' }));

  await fillValid(form);
  await form.submit.click();
  await expect.element(form.status).toHaveTextContent('Message sent. A reply comes by email.');

  await expect
    .poll(() => {
      return form.name.element();
    })
    .toHaveProperty('value', '');

  expect(form.email.element()).toHaveProperty('value', '');
  expect(form.message.element()).toHaveProperty('value', '');
});

caseTest('contact-form.status-live', 'status region present and empty', async () => {
  const form = await mountForm(answering({ status: 'idle' }));

  await expect.element(form.status).toBeInTheDocument();
  expect(form.status.element().textContent).toBe('');
});

caseTest('copy-email.idle', 'email text and Copy button', async () => {
  const screen = await render(<CopyEmail email={EMAIL} copy={COPY_LABELS} />);

  await expect.element(screen.getByText(EMAIL, { exact: true })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Copy', exact: true })).toBeVisible();
});

caseTest('copy-email.copied', 'Copied for 1.6 s', async () => {
  const write = vi.spyOn(window.navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const screen = await render(<CopyEmail email={EMAIL} copy={COPY_LABELS} />);

  await screen.getByRole('button', { name: 'Copy', exact: true }).click();

  const copied = screen.getByRole('button', { name: 'Copied', exact: true });

  await expect.element(copied).toBeVisible();
  expect(write).toHaveBeenCalledWith(EMAIL);

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 1300);
  });

  await expect.element(copied).toBeVisible();

  await expect
    .element(screen.getByRole('button', { name: 'Copy', exact: true }), { timeout: 1000 })
    .toBeVisible();
});

caseTest('copy-email.live-region', 'polite region announces Copied', async () => {
  vi.spyOn(window.navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const screen = await render(<CopyEmail email={EMAIL} copy={COPY_LABELS} />);
  const region = screen.getByRole('status');

  expect(region.element().textContent).toBe('');
  expect(region.element().getAttribute('aria-live')).toBe('polite');

  await screen.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect.element(region).toHaveTextContent('Copied');
  await expect.element(region, { timeout: 2500 }).toHaveTextContent('');
});

caseTest('copy-email.fallback', 'selects the text when the clipboard fails', async () => {
  vi.spyOn(window.navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
  const screen = await render(<CopyEmail email={EMAIL} copy={COPY_LABELS} />);

  await screen.getByRole('button', { name: 'Copy', exact: true }).click();

  await expect
    .poll(() => {
      return window.getSelection()?.toString();
    })
    .toBe(EMAIL);

  await expect.element(screen.getByRole('button', { name: 'Copy', exact: true })).toBeVisible();
});

caseTest('copy-email.tracks-once', 'one click, one event', async () => {
  vi.spyOn(window.navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const screen = await render(<CopyEmail email={EMAIL} copy={COPY_LABELS} />);

  expect(details).toEqual([]);

  await screen.getByRole('button', { name: 'Copy', exact: true }).click();

  expect(details).toEqual([{ name: 'email_copy' }]);
});
