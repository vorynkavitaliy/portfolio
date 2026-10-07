import { afterEach, beforeEach, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/shared/tracked-link.case-test';
import { ANALYTICS_EVENT } from '@/core/analytics/analytics';
import { TrackedLink } from '@/shared/tracked-link.client';

let details: unknown[];

const recordEvent = (event: Event): void => {
  details.push(event instanceof CustomEvent ? event.detail : undefined);
};

const cancelNavigation = (event: MouseEvent): void => {
  event.preventDefault();
};

beforeEach(() => {
  details = [];
  window.addEventListener(ANALYTICS_EVENT, recordEvent);
  document.addEventListener('click', cancelNavigation);
});

afterEach(() => {
  window.removeEventListener(ANALYTICS_EVENT, recordEvent);
  document.removeEventListener('click', cancelNavigation);
});

caseTest('tracked-link.renders', 'plain anchor by default', async () => {
  const screen = await render(
    <TrackedLink href="/cv.pdf" event={{ name: 'cv_download' }} className="btn">
      CV
    </TrackedLink>,
  );

  const link = screen.getByRole('link', { name: 'CV', exact: true });

  await expect.element(link).toHaveAttribute('href', '/cv.pdf');
  await expect.element(link).toHaveClass('btn');
  await expect.element(link).not.toHaveAttribute('target');
  await expect.element(link).not.toHaveAttribute('rel');
  await expect.element(link).not.toHaveAttribute('download');
});

caseTest('tracked-link.click-once', 'one click, one event', async () => {
  const screen = await render(
    <TrackedLink href="#" event={{ name: 'take_off' }}>
      Go
    </TrackedLink>,
  );

  await screen.getByRole('link', { name: 'Go', exact: true }).click();

  expect(details).toEqual([{ name: 'take_off' }]);
});

caseTest('tracked-link.no-click-no-event', 'rendering is silent', async () => {
  const screen = await render(
    <TrackedLink href="#" event={{ name: 'take_off' }}>
      Go
    </TrackedLink>,
  );

  screen.getByRole('link', { name: 'Go', exact: true }).element().focus();

  expect(details).toEqual([]);
});

caseTest('tracked-link.two-clicks', 'each click is an action', async () => {
  const screen = await render(
    <TrackedLink href="#" event={{ name: 'email_copy' }}>
      Go
    </TrackedLink>,
  );

  const link = screen.getByRole('link', { name: 'Go', exact: true });

  await link.click();
  await link.click();

  expect(details).toEqual([{ name: 'email_copy' }, { name: 'email_copy' }]);
});

caseTest('tracked-link.cv', 'CV download is reported and downloads', async () => {
  const screen = await render(
    <TrackedLink href="/cv.pdf" download event={{ name: 'cv_download' }}>
      CV
    </TrackedLink>,
  );

  const link = screen.getByRole('link', { name: 'CV', exact: true });

  await expect.element(link).toHaveAttribute('download');
  await link.click();

  expect(details).toEqual([{ name: 'cv_download' }]);
});

caseTest('tracked-link.linkedin', 'LinkedIn click', async () => {
  const screen = await render(
    <TrackedLink
      href="https://www.linkedin.com/in/example"
      external
      event={{ name: 'linkedin_click' }}
    >
      LinkedIn
    </TrackedLink>,
  );

  await screen.getByRole('link', { name: 'LinkedIn', exact: true }).click();

  expect(details).toEqual([{ name: 'linkedin_click' }]);
});

caseTest('tracked-link.email', 'mailto click reports once', async () => {
  const screen = await render(
    <TrackedLink href="mailto:someone@example.test" event={{ name: 'email_copy' }}>
      Email
    </TrackedLink>,
  );

  await screen.getByRole('link', { name: 'Email', exact: true }).click();

  expect(details).toHaveLength(1);
});

caseTest('tracked-link.external', 'new tab with noopener', async () => {
  const screen = await render(
    <TrackedLink href="https://example.test" external event={{ name: 'linkedin_click' }}>
      Out
    </TrackedLink>,
  );

  const link = screen.getByRole('link', { name: 'Out', exact: true });

  await expect.element(link).toHaveAttribute('target', '_blank');
  await expect.element(link).toHaveAttribute('rel', 'noopener');
});

caseTest('tracked-link.internal', 'no target and no rel', async () => {
  const screen = await render(
    <TrackedLink href="#contact" event={{ name: 'take_off' }}>
      In
    </TrackedLink>,
  );

  const link = screen.getByRole('link', { name: 'In', exact: true });

  await expect.element(link).not.toHaveAttribute('target');
  await expect.element(link).not.toHaveAttribute('rel');
});
