import { expect } from 'vitest';

import { caseTest } from '@tests/back/sections/contact/anti-bot.case-test';
import { isBotSubmission } from '@/sections/contact/actions/anti-bot';

import type { RawContactForm } from '@/sections/contact/contact.schema';

const NOW = 1_760_000_000_000;

const form = (website: string, startedAt: string): RawContactForm => {
  return {
    name: 'Ann Lee',
    email: 'ann@example.test',
    message: 'Hello, let us talk about a role.',
    website,
    startedAt,
  };
};

const ago = (ms: number): string => {
  return String(NOW - ms);
};

caseTest('sec.antibot.human', 'empty honeypot, 3 s fill', () => {
  expect(isBotSubmission(form('', ago(3000)), NOW)).toBe(false);
});

caseTest('sec.antibot.honeypot', 'filled honeypot', () => {
  expect(isBotSubmission(form('https://spam.test', ago(60_000)), NOW)).toBe(true);
  expect(isBotSubmission(form('x', ''), NOW)).toBe(true);
});

caseTest('sec.antibot.honeypot-whitespace', 'spaces only', () => {
  expect(isBotSubmission(form('   ', ago(60_000)), NOW)).toBe(false);
});

caseTest('sec.antibot.too-fast', 'under 3000 ms', () => {
  expect(isBotSubmission(form('', ago(2999)), NOW)).toBe(true);
  expect(isBotSubmission(form('', ago(1)), NOW)).toBe(true);
});

caseTest('sec.antibot.future', 'startedAt ahead of now', () => {
  expect(isBotSubmission(form('', String(NOW + 5000)), NOW)).toBe(true);
});

caseTest('sec.antibot.no-js', 'empty startedAt', () => {
  expect(isBotSubmission(form('', ''), NOW)).toBe(false);
  expect(isBotSubmission(form('', '   '), NOW)).toBe(false);
});

caseTest('sec.antibot.not-a-number', 'non-finite startedAt', () => {
  expect(isBotSubmission(form('', 'abc'), NOW)).toBe(false);
  expect(isBotSubmission(form('', 'Infinity'), NOW)).toBe(false);
});
