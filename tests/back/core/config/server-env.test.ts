import { expect, vi } from 'vitest';

import { caseTest } from '@tests/back/core/config/server-env.case-test';
import { parseServerEnv, type EnvSource } from '@/core/config/server-env';

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
