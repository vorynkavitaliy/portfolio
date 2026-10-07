'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
} from 'react';

import { track } from '@/core/analytics/analytics';
import { worldStore } from '@/core/world/world-store';
import { CONTACT_LIMITS } from '@/sections/contact/contact.limits';

import type { ContactFormCopy } from '@/content/content.types';
import type {
  ContactField,
  ContactFieldErrors,
  ContactFormState,
} from '@/sections/contact/contact.types';

type ContactAction = (previous: ContactFormState, formData: FormData) => Promise<ContactFormState>;

type ContactFormProps = Readonly<{
  action: ContactAction;
  copy: ContactFormCopy;
}>;

const FIELD_ORDER: readonly ContactField[] = ['name', 'email', 'message'];

const IDLE_STATE: ContactFormState = { status: 'idle' };

const loadSchema = () => {
  return import('@/sections/contact/contact.schema');
};

const readText = (formData: FormData, name: string): string => {
  const value: FormDataEntryValue | null = formData.get(name);

  return typeof value === 'string' ? value : '';
};

const statusText = (state: ContactFormState, clientInvalid: boolean, copy: ContactFormCopy) => {
  if (clientInvalid) {
    return copy.status.invalid;
  }

  if (state.status === 'sent') {
    return copy.status.sent;
  }

  if (state.status === 'error') {
    if (state.code === 'RATE_LIMITED') {
      return copy.status.rateLimited;
    }

    if (state.code === 'SEND_FAILED') {
      return copy.status.sendFailed;
    }

    return copy.status.invalid;
  }

  return '';
};

export const ContactForm = ({ action, copy }: ContactFormProps) => {
  const [state, formAction, pending] = useActionState<ContactFormState, FormData>(
    action,
    IDLE_STATE,
  );

  const [startedAt, setStartedAt] = useState<string>('');
  const [clientErrors, setClientErrors] = useState<ContactFieldErrors | null>(null);
  const handledState = useRef<ContactFormState>(IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer: number = window.setTimeout(() => {
      setStartedAt(String(Date.now()));
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const focusFirstInvalid = (errors: ContactFieldErrors): void => {
    const first: ContactField | undefined = FIELD_ORDER.find((field) => {
      return errors[field] !== undefined;
    });

    if (first !== undefined) {
      document.getElementById(`f-${first}`)?.focus();
    }
  };

  useEffect(() => {
    if (state === handledState.current) {
      return;
    }

    handledState.current = state;

    if (state.status === 'sent') {
      formRef.current?.reset();
      worldStore.dispatch({ type: 'celebrate-send' });
      track({ name: 'contact_sent' });
    }

    if (state.status === 'error' && state.fieldErrors !== null) {
      focusFirstInvalid(state.fieldErrors);
    }
  }, [state]);

  const warmSchema = (): void => {
    void loadSchema();
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const { z, contactSchema, fieldErrorsOf } = await loadSchema().then(async (schema) => {
      const zod = await import('zod/mini');

      return { z: zod, ...schema };
    });

    const result = z.safeParse(contactSchema, {
      name: readText(formData, 'name'),
      email: readText(formData, 'email'),
      message: readText(formData, 'message'),
      website: readText(formData, 'website'),
    });

    if (result.success) {
      setClientErrors(null);

      startTransition(() => {
        formAction(formData);
      });

      return;
    }

    const errors: ContactFieldErrors = fieldErrorsOf(result.error);

    setClientErrors(errors);
    focusFirstInvalid(errors);
  };

  const shownErrors: ContactFieldErrors =
    clientErrors ??
    (state.status === 'error' && state.fieldErrors !== null ? state.fieldErrors : {});

  const describe = (field: ContactField) => {
    const message: string | undefined = shownErrors[field];

    return {
      'aria-invalid': message === undefined ? undefined : true,
      'aria-describedby': `e-${field}`,
    } as const;
  };

  const status: string = statusText(state, clientErrors !== null, copy);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      onFocus={warmSchema}
      onInput={warmSchema}
      noValidate
      data-contact-form=""
    >
      <input type="hidden" name="startedAt" value={startedAt} />

      <div className="row2">
        <div className="field" data-motion="item">
          <label htmlFor="f-name">{copy.labels.name}</label>

          <input
            id="f-name"
            name="name"
            autoComplete="name"
            maxLength={CONTACT_LIMITS.name}
            {...describe('name')}
          />

          <span className="err" id="e-name">
            {shownErrors.name ?? ''}
          </span>
        </div>

        <div className="field" data-motion="item">
          <label htmlFor="f-email">{copy.labels.email}</label>

          <input
            id="f-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={CONTACT_LIMITS.email}
            {...describe('email')}
          />

          <span className="err" id="e-email">
            {shownErrors.email ?? ''}
          </span>
        </div>
      </div>

      <div className="field" data-motion="item">
        <label htmlFor="f-message">{copy.labels.message}</label>

        <textarea
          id="f-message"
          name="message"
          maxLength={CONTACT_LIMITS.message}
          {...describe('message')}
        />

        <span className="err" id="e-message">
          {shownErrors.message ?? ''}
        </span>
      </div>

      <div className="hp" aria-hidden="true">
        <label htmlFor="f-website">{copy.labels.website}</label>

        <input id="f-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div data-motion="item">
        <button type="submit" className="btn btn-signal pixel" data-magnet="" disabled={pending}>
          {pending ? copy.sending : copy.submit}
        </button>
      </div>

      <p className="status" id="status" role="status">
        {status}
      </p>
    </form>
  );
};
