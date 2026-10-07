import type { ContactFormCopy } from '@/content/content.types';

export const CONTACT_FORM_COPY: ContactFormCopy = {
  labels: { name: 'Name', email: 'Email', message: 'Message', website: 'Website' },
  submit: 'Send message',
  sending: 'Sending…',
  errors: {
    name: 'Enter your name.',
    email: 'Enter a valid email, like name@company.com.',
    message: 'Write at least 10 characters.',
    nameTooLong: 'That name is too long. Shorten it.',
    emailTooLong: 'That email is too long. Check the address.',
    messageTooLong: 'That message is too long. Shorten it.',
  },
  status: {
    invalid: 'Message not sent. Check the marked fields.',
    sent: 'Message sent. A reply comes by email.',
    rateLimited: 'Message not sent. Too many messages. Wait a few minutes and try again.',
    verificationFailed:
      'Message not sent. The spam check did not pass. Write to the email address above.',
    sendFailed: 'Message not sent. Try again, or write to the email address above.',
  },
};
