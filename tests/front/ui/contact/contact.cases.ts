export type ContactCaseSource = 'spec' | 'prototype' | 'wcag' | 'security-md' | 'owner-2026-10-07';

export type ContactCase = Readonly<{
  id: string;
  source: ContactCaseSource;
  reference: string;
  expected: string;
}>;

export const CONTACT_CASES = [
  {
    id: 'contact-form.limits',
    source: 'security-md',
    reference: 'security.md §1 Validation (name 1–80, email ≤ 254, message ≤ 4000); S11 handoff',
    expected: 'name, email and message inputs carry maxlength 80, 254 and 4000',
  },
  {
    id: 'contact-form.honeypot',
    source: 'prototype',
    reference: 'docs/prototype/index.html:336 (div.hp aria-hidden, tabindex -1, autocomplete off)',
    expected:
      'the website input sits in an aria-hidden wrapper, has tabindex -1, autocomplete off and is reachable by no role query',
  },
  {
    id: 'contact-form.started-at-mount',
    source: 'security-md',
    reference: 'security.md §1 Anti-bot (startedAt set when the form becomes interactive)',
    expected: 'after mount the hidden startedAt value is the current time in milliseconds',
  },
  {
    id: 'contact-form.empty-errors',
    source: 'prototype',
    reference: 'docs/prototype/index.html:733–735, :740–745',
    expected:
      'empty submit shows the three exact error messages, marks the fields invalid, links each message with aria-describedby, does not call the action and shows the invalid status',
  },
  {
    id: 'contact-form.focus-first-invalid',
    source: 'prototype',
    reference: 'docs/prototype/index.html:744 (first.focus())',
    expected:
      'the first invalid field takes focus: name when empty, email when only email and message are invalid, message when only the message is invalid',
  },
  {
    id: 'contact-form.client-rules',
    source: 'security-md',
    reference: 'security.md §1 Validation (one schema shared by client and server)',
    expected:
      'a malformed email and a 9-character message are rejected with their copy; a 10-character message is accepted',
  },
  {
    id: 'contact-form.valid-submit',
    source: 'spec',
    reference: 'FR-046 (valid form reaches the action)',
    expected: 'a valid form calls the action once with the typed name, email and message',
  },
  {
    id: 'contact-form.pending',
    source: 'owner-2026-10-07',
    reference: 'plan S20: pending disables submit; copy "Sending…"',
    expected: 'while the action is pending the submit button reads «Sending…» and is disabled',
  },
  {
    id: 'contact-form.sent',
    source: 'spec',
    reference: 'plan S20: sent → success status, celebrate-send, contact_sent',
    expected:
      'a sent result shows the sent status, dispatches celebrate-send once and tracks contact_sent once',
  },
  {
    id: 'contact-form.not-sent-silent',
    source: 'spec',
    reference: 'SC-019 (events fire once per action)',
    expected: 'invalid and failed results dispatch no celebration and track no contact_sent',
  },
  {
    id: 'contact-form.rate-limited',
    source: 'security-md',
    reference: 'security.md §1 RATE_LIMITED; contact-form.content.ts status.rateLimited',
    expected: 'RATE_LIMITED shows the rate-limited status',
  },
  {
    id: 'contact-form.send-failed',
    source: 'security-md',
    reference: 'security.md §1 no provider errors to the client; status.sendFailed',
    expected: 'SEND_FAILED shows the send-failed status',
  },
  {
    id: 'contact-form.server-field-errors',
    source: 'spec',
    reference: 'plan §5.7 ContactFormState error with fieldErrors',
    expected:
      'INVALID_INPUT from the server shows its field errors, the invalid status and focuses the first invalid field',
  },
  {
    id: 'contact-form.status-live',
    source: 'wcag',
    reference: 'WCAG 4.1.3 status messages; prototype :730 p.status role=status',
    expected: 'the status line has role status and is empty before any submit',
  },
  {
    id: 'copy-email.idle',
    source: 'owner-2026-10-07',
    reference: 'stations.content.ts contact.copy',
    expected: 'the email text and a button labelled «Copy» render',
  },
  {
    id: 'copy-email.copied',
    source: 'prototype',
    reference: 'docs/prototype/index.html:652–655 (Copied for 1600 ms)',
    expected:
      'click writes the email to the clipboard, the button reads «Copied», then returns to «Copy» after 1.6 s',
  },
  {
    id: 'copy-email.fallback',
    source: 'prototype',
    reference: 'docs/prototype/index.html:653–654 (select on clipboard failure)',
    expected: 'when the clipboard rejects, the email text is selected and the label stays «Copy»',
  },
  {
    id: 'copy-email.tracks-once',
    source: 'spec',
    reference: 'SC-019 (email_copy once per click)',
    expected: 'one click dispatches exactly one email_copy event; rendering dispatches none',
  },
] as const satisfies readonly ContactCase[];

export type ContactCaseId = (typeof CONTACT_CASES)[number]['id'];
