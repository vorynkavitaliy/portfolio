export type AntiBotCaseSource = 'security-md' | 'spec' | 'owner-2026-10-07';

export type AntiBotCase = Readonly<{
  id: string;
  source: AntiBotCaseSource;
  reference: string;
  expected: string;
}>;

const ANTI_BOT = 'rules/security.md §1 «Anti-bot» (honeypot «website», startedAt ≥ 3 s)';

const NO_JS =
  'owner decision Q-21 adopted in plan 0002 §2 (empty startedAt = no JavaScript = human); spec FR-050';

const CONTRACT =
  'plan 0002 §5.7 isBotSubmission (website non-empty after trim; startedAt finite and now − startedAt < 3000, future = bot)';

export const ANTI_BOT_CASES = [
  {
    id: 'sec.antibot.human',
    source: 'security-md',
    reference: ANTI_BOT,
    expected: 'an empty honeypot and startedAt exactly 3000 ms ago is a human',
  },
  {
    id: 'sec.antibot.honeypot',
    source: 'security-md',
    reference: ANTI_BOT,
    expected: 'a filled honeypot is a bot even with an old startedAt or none',
  },
  {
    id: 'sec.antibot.honeypot-whitespace',
    source: 'owner-2026-10-07',
    reference: CONTRACT,
    expected: 'a honeypot holding only spaces is not a bot signal',
  },
  {
    id: 'sec.antibot.too-fast',
    source: 'security-md',
    reference: ANTI_BOT,
    expected: 'startedAt 2999 ms ago is a bot, 1 ms ago is a bot',
  },
  {
    id: 'sec.antibot.future',
    source: 'owner-2026-10-07',
    reference: CONTRACT,
    expected: 'a startedAt 5000 ms in the future is a bot',
  },
  {
    id: 'sec.antibot.no-js',
    source: 'owner-2026-10-07',
    reference: NO_JS,
    expected: 'an empty or whitespace startedAt with an empty honeypot is a human',
  },
  {
    id: 'sec.antibot.not-a-number',
    source: 'owner-2026-10-07',
    reference: `${CONTRACT} (only a finite startedAt is timed)`,
    expected: 'startedAt «abc» or «Infinity» is not timed and counts as a human',
  },
] as const satisfies readonly AntiBotCase[];

export type AntiBotCaseId = (typeof ANTI_BOT_CASES)[number]['id'];
