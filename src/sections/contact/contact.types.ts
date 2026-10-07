export type ContactErrorCode = 'RATE_LIMITED' | 'INVALID_INPUT' | 'SEND_FAILED';

export type ContactField = 'name' | 'email' | 'message';

export type ContactFieldErrors = Readonly<Partial<Record<ContactField, string>>>;

export type ContactFormState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; code: ContactErrorCode; fieldErrors: ContactFieldErrors | null };
