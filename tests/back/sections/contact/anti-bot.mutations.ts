import type { AntiBotCaseId } from '@tests/back/sections/contact/anti-bot.cases';

export type AntiBotMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly AntiBotCaseId[];
}>;

const ANTI_BOT = 'src/sections/contact/actions/anti-bot.ts';

export const ANTI_BOT_MUTATIONS: readonly AntiBotMutation[] = [
  {
    id: 'min-fill.zero',
    file: ANTI_BOT,
    find: 'MIN_FILL_MS = 3000',
    replace: 'MIN_FILL_MS = 0',
    caseIds: ['sec.antibot.too-fast'],
  },
  {
    id: 'min-fill.inclusive',
    file: ANTI_BOT,
    find: 'now - started < MIN_FILL_MS',
    replace: 'now - started <= MIN_FILL_MS',
    caseIds: ['sec.antibot.human'],
  },
  {
    id: 'future.allowed',
    file: ANTI_BOT,
    find: 'now - started < MIN_FILL_MS',
    replace: 'now - started < MIN_FILL_MS && now >= started',
    caseIds: ['sec.antibot.future'],
  },
  {
    id: 'honeypot.inverted',
    file: ANTI_BOT,
    find: "if (raw.website.trim() !== '') {",
    replace: "if (raw.website.trim() === '') {",
    caseIds: ['sec.antibot.human', 'sec.antibot.honeypot'],
  },
  {
    id: 'honeypot.untrimmed',
    file: ANTI_BOT,
    find: "raw.website.trim() !== ''",
    replace: "raw.website !== ''",
    caseIds: ['sec.antibot.honeypot-whitespace'],
  },
  {
    id: 'no-js.is-bot',
    file: ANTI_BOT,
    find: "if (startedAt === '') {\n    return false;",
    replace: "if (startedAt === '') {\n    return true;",
    caseIds: ['sec.antibot.no-js'],
  },
  {
    id: 'non-finite.is-bot',
    file: ANTI_BOT,
    find: 'Number.isFinite(started) && now - started < MIN_FILL_MS',
    replace: '!Number.isFinite(started) || now - started < MIN_FILL_MS',
    caseIds: ['sec.antibot.not-a-number'],
  },
];
