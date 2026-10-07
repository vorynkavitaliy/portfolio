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
import { TURNSTILE_ACTION, TURNSTILE_FIELD } from '@/sections/contact/contact.types';

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
  turnstileSiteKey: string | null;
}>;

type TurnstileOptions = Readonly<{
  sitekey: string;
  action: string;
  appearance: 'interaction-only';
  'response-field': false;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
}>;

type TurnstileApi = Readonly<{
  render: (container: HTMLElement, options: TurnstileOptions) => string | null | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}>;

type TurnstileWidget = Readonly<{ api: TurnstileApi; id: string }>;

type TurnstilePhase = 'idle' | 'loading' | 'ready' | 'failed';

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const TOKEN_WAIT_MS = 5000;

const FIELD_ORDER: readonly ContactField[] = ['name', 'email', 'message'];

const IDLE_STATE: ContactFormState = { status: 'idle' };

const loadSchema = () => {
  return import('@/sections/contact/contact.schema');
};

const loadValidator = async () => {
  try {
    const schema = await loadSchema();

    return { validate: schema.validateContactForm };
  } catch {
    return null;
  }
};

let turnstileScript: Promise<void> | null = null;

const isTurnstileApi = (value: unknown): value is TurnstileApi => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof Reflect.get(value, 'render') === 'function' &&
    typeof Reflect.get(value, 'reset') === 'function' &&
    typeof Reflect.get(value, 'remove') === 'function'
  );
};

const readTurnstile = (): TurnstileApi | null => {
  const value: unknown = Reflect.get(window, 'turnstile');

  return isTurnstileApi(value) ? value : null;
};

const injectTurnstileScript = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    const script: HTMLScriptElement = document.createElement('script');

    script.src = TURNSTILE_SCRIPT;
    script.async = true;

    script.addEventListener('load', () => {
      resolve();
    });

    script.addEventListener('error', () => {
      resolve();
    });

    document.head.append(script);
  });
};

const loadTurnstile = async (): Promise<TurnstileApi | null> => {
  const ready: TurnstileApi | null = readTurnstile();

  if (ready !== null) {
    return ready;
  }

  turnstileScript ??= injectTurnstileScript();
  await turnstileScript;

  return readTurnstile();
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

    if (state.code === 'VERIFICATION_FAILED') {
      return copy.status.verificationFailed;
    }

    if (state.code === 'SEND_FAILED') {
      return copy.status.sendFailed;
    }

    return copy.status.invalid;
  }

  return '';
};

export const ContactForm = ({ action, copy, turnstileSiteKey }: ContactFormProps) => {
  const [state, formAction, pending] = useActionState<ContactFormState, FormData>(
    action,
    IDLE_STATE,
  );

  const [startedAt, setStartedAt] = useState<string>('');
  const [clientErrors, setClientErrors] = useState<ContactFieldErrors | null>(null);
  const handledState = useRef<ContactFormState>(IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const validating = useRef<boolean>(false);
  const challengeRef = useRef<HTMLDivElement>(null);
  const turnstilePhase = useRef<TurnstilePhase>('idle');
  const turnstileWidget = useRef<TurnstileWidget | null>(null);
  const turnstileToken = useRef<string>('');
  const tokenWaiters = useRef<Array<(token: string) => void>>([]);

  useEffect(() => {
    const timer: number = window.setTimeout(() => {
      setStartedAt(String(Date.now()));
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    return () => {
      const widget: TurnstileWidget | null = turnstileWidget.current;

      if (widget !== null) {
        widget.api.remove(widget.id);
      }
    };
  }, []);

  const releaseWaiters = (token: string): void => {
    const waiters = tokenWaiters.current;

    tokenWaiters.current = [];

    for (const resolve of waiters) {
      resolve(token);
    }
  };

  const failTurnstile = (): void => {
    turnstilePhase.current = 'failed';
    releaseWaiters('');
  };

  const mountTurnstile = (api: TurnstileApi | null, siteKey: string): void => {
    const container: HTMLDivElement | null = challengeRef.current;

    if (api === null || container === null) {
      failTurnstile();

      return;
    }

    const id = api.render(container, {
      sitekey: siteKey,
      action: TURNSTILE_ACTION,
      appearance: 'interaction-only',
      'response-field': false,
      callback: (token: string) => {
        turnstileToken.current = token;
        releaseWaiters(token);
      },
      'expired-callback': () => {
        turnstileToken.current = '';
      },
      'error-callback': () => {
        turnstileToken.current = '';
        releaseWaiters('');
      },
    });

    if (typeof id !== 'string') {
      failTurnstile();

      return;
    }

    turnstileWidget.current = { api, id };
    turnstilePhase.current = 'ready';
  };

  const startTurnstile = (): void => {
    if (turnstileSiteKey === null || turnstilePhase.current !== 'idle') {
      return;
    }

    turnstilePhase.current = 'loading';

    void loadTurnstile().then(
      (api: TurnstileApi | null) => {
        mountTurnstile(api, turnstileSiteKey);
      },
      () => {
        failTurnstile();
      },
    );
  };

  const waitForToken = (): Promise<string> => {
    if (turnstileToken.current !== '') {
      return Promise.resolve(turnstileToken.current);
    }

    if (turnstileSiteKey === null || turnstilePhase.current === 'failed') {
      return Promise.resolve('');
    }

    return new Promise<string>((resolve) => {
      tokenWaiters.current = [...tokenWaiters.current, resolve];

      window.setTimeout(() => {
        resolve('');
      }, TOKEN_WAIT_MS);
    });
  };

  const takeToken = async (): Promise<string> => {
    startTurnstile();

    const token: string = await waitForToken();
    const widget: TurnstileWidget | null = turnstileWidget.current;

    turnstileToken.current = '';

    if (widget !== null) {
      widget.api.reset(widget.id);
    }

    return token;
  };

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
    void loadValidator();
    startTurnstile();
  };

  const submitToServer = async (formData: FormData): Promise<void> => {
    formData.set(TURNSTILE_FIELD, await takeToken());
    setClientErrors(null);

    startTransition(() => {
      formAction(formData);
    });
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (validating.current) {
      return;
    }

    validating.current = true;

    const formData = new FormData(event.currentTarget);

    try {
      const loaded = await loadValidator();

      if (loaded === null) {
        await submitToServer(formData);

        return;
      }

      const errors = loaded.validate({
        name: readText(formData, 'name'),
        email: readText(formData, 'email'),
        message: readText(formData, 'message'),
        website: readText(formData, 'website'),
      });

      if (errors === null) {
        await submitToServer(formData);

        return;
      }

      setClientErrors(errors);
      focusFirstInvalid(errors);
    } finally {
      validating.current = false;
    }
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

      <div ref={challengeRef} data-turnstile="" />

      <p className="status" id="status" role="status">
        {status}
      </p>
    </form>
  );
};
