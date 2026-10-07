import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/contact/contact.case-test';
import { CONTACT_FORM_COPY } from '@/content/contact-form.content';
import { ContactForm } from '@/sections/contact/contact-form.client';

import type { ContactFormState } from '@/sections/contact/contact.types';

vi.mock('@/sections/contact/contact.schema', () => {
  return {
    get contactSchema() {
      throw new Error('schema-chunk');
    },
    get validateContactForm() {
      throw new Error('schema-chunk');
    },
  };
});

caseTest('contact-form.schema-load-failed', 'a failed schema chunk still submits', async () => {
  const action = vi.fn<
    (previous: ContactFormState, formData: FormData) => Promise<ContactFormState>
  >(() => {
    return Promise.resolve({ status: 'idle' });
  });

  const screen = await render(
    <ContactForm action={action} copy={CONTACT_FORM_COPY} turnstileSiteKey={null} />,
  );

  await screen.getByRole('textbox', { name: 'Name', exact: true }).fill('Ada Lovelace');
  await screen.getByRole('textbox', { name: 'Email', exact: true }).fill('ada@example.test');

  await screen
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('Hello there, this is long enough.');

  await screen.getByRole('button', { name: 'Send message', exact: true }).click();

  await expect
    .poll(() => {
      return action.mock.calls.length;
    })
    .toBe(1);

  const sent: FormData | undefined = action.mock.calls[0]?.[1];

  expect(sent?.get('name')).toBe('Ada Lovelace');
  expect(sent?.get('email')).toBe('ada@example.test');
  expect(sent?.get('message')).toBe('Hello there, this is long enough.');
});
