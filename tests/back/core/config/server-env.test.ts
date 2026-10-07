import { expect, vi } from 'vitest';

import { caseTest } from '@tests/back/core/config/server-env.case-test';
import {
  parseServerEnv,
  parseTurnstileSecret,
  parseTurnstileSiteKey,
  type EnvSource,
} from '@/core/config/server-env';

const VALID: EnvSource = {
  SMTP_HOST: 'smtp.example.test',
  SMTP_PORT: '587',
  SMTP_USER: 'mailer-user',
  SMTP_PASS: 'mailer-pass-zq81',
  CONTACT_FROM: 'site@example.test',
  CONTACT_TO: 'owner@example.test',
  CLIENT_IP_HEADER: 'x-real-ip',
};

const invalid = (names: string): Error => {
  return new Error(`Invalid server environment: ${names}`);
};

const without = (name: string): EnvSource => {
  return { ...VALID, [name]: undefined };
};

caseTest('sec.env.all-present', 'parses every variable', () => {
  expect(parseServerEnv(VALID)).toEqual({
    SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: 587,
    SMTP_USER: 'mailer-user',
    SMTP_PASS: 'mailer-pass-zq81',
    CONTACT_FROM: 'site@example.test',
    CONTACT_TO: 'owner@example.test',
    CLIENT_IP_HEADER: 'x-real-ip',
  });
});

caseTest('sec.env.missing.smtp-host', 'names SMTP_HOST', () => {
  expect(() => {
    parseServerEnv(without('SMTP_HOST'));
  }).toThrow(invalid('SMTP_HOST'));
});

caseTest('sec.env.missing.smtp-port', 'names SMTP_PORT', () => {
  expect(() => {
    parseServerEnv(without('SMTP_PORT'));
  }).toThrow(invalid('SMTP_PORT'));
});

caseTest('sec.env.missing.smtp-user', 'names SMTP_USER', () => {
  expect(() => {
    parseServerEnv(without('SMTP_USER'));
  }).toThrow(invalid('SMTP_USER'));
});

caseTest('sec.env.missing.smtp-pass', 'names SMTP_PASS', () => {
  expect(() => {
    parseServerEnv(without('SMTP_PASS'));
  }).toThrow(invalid('SMTP_PASS'));
});

caseTest('sec.env.missing.contact-from', 'names CONTACT_FROM', () => {
  expect(() => {
    parseServerEnv(without('CONTACT_FROM'));
  }).toThrow(invalid('CONTACT_FROM'));
});

caseTest('sec.env.missing.contact-to', 'names CONTACT_TO', () => {
  expect(() => {
    parseServerEnv(without('CONTACT_TO'));
  }).toThrow(invalid('CONTACT_TO'));
});

caseTest('sec.env.missing.client-ip-header', 'names CLIENT_IP_HEADER', () => {
  expect(() => {
    parseServerEnv(without('CLIENT_IP_HEADER'));
  }).toThrow(invalid('CLIENT_IP_HEADER'));
});

caseTest('sec.env.blank-is-missing', 'an empty SMTP_HOST names SMTP_HOST', () => {
  expect(() => {
    parseServerEnv({ ...VALID, SMTP_HOST: '' });
  }).toThrow(invalid('SMTP_HOST'));
});

caseTest('sec.env.port.non-numeric', 'abc is rejected', () => {
  expect(() => {
    parseServerEnv({ ...VALID, SMTP_PORT: 'abc' });
  }).toThrow(invalid('SMTP_PORT'));
});

caseTest('sec.env.port.below-range', '0 is rejected', () => {
  expect(() => {
    parseServerEnv({ ...VALID, SMTP_PORT: '0' });
  }).toThrow(invalid('SMTP_PORT'));
});

caseTest('sec.env.port.above-range', '65536 is rejected', () => {
  expect(() => {
    parseServerEnv({ ...VALID, SMTP_PORT: '65536' });
  }).toThrow(invalid('SMTP_PORT'));

  expect(parseServerEnv({ ...VALID, SMTP_PORT: '65535' }).SMTP_PORT).toBe(65535);
});

caseTest('sec.env.port.not-integer', '587.5 is rejected', () => {
  expect(() => {
    parseServerEnv({ ...VALID, SMTP_PORT: '587.5' });
  }).toThrow(invalid('SMTP_PORT'));
});

caseTest('sec.env.port.smtps', '465 is accepted', () => {
  expect(parseServerEnv({ ...VALID, SMTP_PORT: '465' }).SMTP_PORT).toBe(465);
});

caseTest('sec.env.contact-to.not-email', 'is rejected', () => {
  expect(() => {
    parseServerEnv({ ...VALID, CONTACT_TO: 'not-an-email' });
  }).toThrow(invalid('CONTACT_TO'));
});

caseTest('sec.env.names-all', 'names both once', () => {
  expect(() => {
    parseServerEnv({ ...VALID, SMTP_HOST: undefined, SMTP_PORT: 'abc' });
  }).toThrow(invalid('SMTP_HOST, SMTP_PORT'));
});

caseTest('sec.env.names-only', 'values never appear in the error', () => {
  const secretLooking = 'hunter2-not-an-email-9f3a';
  let message = '';

  try {
    parseServerEnv({ ...VALID, CONTACT_TO: secretLooking, SMTP_PORT: 'port-value-77' });
  } catch (error) {
    message = error instanceof Error ? error.message : '';
  }

  expect(message).toContain('CONTACT_TO');
  expect(message).not.toContain(secretLooking);
  expect(message).not.toContain('port-value-77');
  expect(message).not.toContain(VALID['SMTP_PASS'] ?? 'missing');
});

caseTest('sec.env.cached', 'second call returns the first result', async () => {
  const { getServerEnv } = await import('@/core/config/server-env');
  const first = getServerEnv();

  vi.stubEnv('SMTP_HOST', 'changed.example.test');

  expect(getServerEnv()).toBe(first);
  expect(getServerEnv().SMTP_HOST).toBe('smtp.test.invalid');
});

caseTest('sec.env.get-fails-loudly', 'names SMTP_PASS', async () => {
  vi.stubEnv('SMTP_PASS', '');

  const { getServerEnv } = await import('@/core/config/server-env');

  expect(() => {
    getServerEnv();
  }).toThrow(invalid('SMTP_PASS'));
});

const TURNSTILE_TEST_SECRETS: readonly string[] = [
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
];

caseTest('sec.env.turnstile.secret-present', 'returns the trimmed secret', () => {
  expect(parseTurnstileSecret({ TURNSTILE_SECRET_KEY: '  0x4AAA-secret-zq81  ' })).toBe(
    '0x4AAA-secret-zq81',
  );
});

caseTest('sec.env.turnstile.secret-missing', 'names the variable, never the value', async () => {
  const named = invalid('TURNSTILE_SECRET_KEY');

  expect(() => {
    parseTurnstileSecret({});
  }).toThrow(named);

  expect(() => {
    parseTurnstileSecret({ TURNSTILE_SECRET_KEY: '   ' });
  }).toThrow(named);

  vi.stubEnv('TURNSTILE_SECRET_KEY', '');

  const { getTurnstileSecret } = await import('@/core/config/server-env');

  expect(() => {
    getTurnstileSecret();
  }).toThrow(named);

  vi.stubEnv('TURNSTILE_SECRET_KEY', '0x4AAA-from-env');
  expect(getTurnstileSecret()).toBe('0x4AAA-from-env');
});

caseTest('sec.env.turnstile.test-secret-production', 'test secrets never reach production', () => {
  const PUBLIC = { NODE_ENV: 'production', SITE_URL: 'https://portfolio.example.test' };

  for (const secret of TURNSTILE_TEST_SECRETS) {
    expect(() => {
      parseTurnstileSecret({ TURNSTILE_SECRET_KEY: secret, ...PUBLIC });
    }).toThrow(/^Invalid server environment: TURNSTILE_SECRET_KEY/);

    for (const local of ['http://localhost:4321', 'http://127.0.0.1:3000', 'http://[::1]:3000']) {
      expect(
        parseTurnstileSecret({
          TURNSTILE_SECRET_KEY: secret,
          NODE_ENV: 'production',
          SITE_URL: local,
        }),
      ).toBe(secret);
    }

    expect(
      parseTurnstileSecret({
        TURNSTILE_SECRET_KEY: secret,
        NODE_ENV: 'development',
        SITE_URL: PUBLIC.SITE_URL,
      }),
    ).toBe(secret);
  }

  expect(parseTurnstileSecret({ TURNSTILE_SECRET_KEY: '0x4AAA-real', ...PUBLIC })).toBe(
    '0x4AAA-real',
  );
});

caseTest('sec.env.turnstile.site-key', 'trimmed value or null', async () => {
  expect(parseTurnstileSiteKey({ TURNSTILE_SITE_KEY: ' 0x4AAAA-site ' })).toBe('0x4AAAA-site');
  expect(parseTurnstileSiteKey({})).toBeNull();
  expect(parseTurnstileSiteKey({ TURNSTILE_SITE_KEY: '  ' })).toBeNull();

  vi.stubEnv('TURNSTILE_SITE_KEY', '1x00000000000000000000BB');

  const { getTurnstileSiteKey } = await import('@/core/config/server-env');

  expect(getTurnstileSiteKey()).toBe('1x00000000000000000000BB');
});
