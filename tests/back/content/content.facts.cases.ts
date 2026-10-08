export type ContentFactsCaseSource =
  'spec' | 'facts' | 'owner-2026-10-07' | 'owner-2026-10-08' | 'security-md';

export type ContentFactsCase = Readonly<{
  id: string;
  source: ContentFactsCaseSource;
  reference: string;
  expected: string;
}>;

const SC_015 = 'SC-015 (docs/spec/portfolio-spec.md:227)';
const CONTENT_RULES = 'content rules';

export const CONTENT_FACTS_CASES = [
  {
    id: 'content.forbidden.list-present',
    source: 'owner-2026-10-07',
    reference: `${CONTENT_RULES} §4 (the list lives in the gitignored forbidden.local.json, a missing file fails loudly)`,
    expected:
      'the list loads and every category (employers, projects, clients, terms, phones) is non-empty',
  },
  {
    id: 'content.forbidden.missing-file-fails-loudly',
    source: 'owner-2026-10-07',
    reference: `${CONTENT_RULES} §4 (never skips)`,
    expected:
      'loading a path that does not exist throws a message naming the file and telling the owner to create it',
  },
  {
    id: 'content.term-matching.word-aware',
    source: 'owner-2026-10-07',
    reference: 'task S13 (case-insensitive, word-aware matching)',
    expected:
      'a term matches as a whole word in any case, with an optional plural s, and never inside a longer word',
  },
  {
    id: 'content.forbidden.names',
    source: 'owner-2026-10-07',
    reference: `${CONTENT_RULES} §2 (no employer or project names anywhere), ${SC_015}`,
    expected:
      'no employer, project or client name from the list occurs as a word in any copy string, case-insensitive',
  },
  {
    id: 'content.forbidden.terms',
    source: 'owner-2026-10-07',
    reference: `${CONTENT_RULES} §2 (owner bans on the LLM product internals and GitHub)`,
    expected: 'no banned term from the list occurs as a word in any copy string, case-insensitive',
  },
  {
    id: 'content.forbidden.committed-files-clean',
    source: 'owner-2026-10-07',
    reference: `${CONTENT_RULES} §4 (names never typed into a committed file)`,
    expected:
      'no name from the list occurs in any .ts file under src/content or tests/back/content',
  },
  {
    id: 'content.no-github',
    source: 'spec',
    reference: 'docs/spec/portfolio-spec.md:86 (no GitHub link anywhere)',
    expected: 'no copy string mentions github and no string is a link to it',
  },
  {
    id: 'content.no-phone',
    source: 'spec',
    reference: `${SC_015}; docs/spec/portfolio-spec.md:86 (public CV without phone)`,
    expected:
      'no phone number from the list and no phone-shaped digit run occurs in any copy string',
  },
  {
    id: 'content.full-cycle.no-internals',
    source: 'owner-2026-10-07',
    reference: `${CONTENT_RULES} §2 (never the LLM product internals), ${SC_015}`,
    expected: 'the full-cycle copy has none of the words pipeline, minute, PDF',
  },
  {
    id: 'content.station-copy.no-pronouns',
    source: 'spec',
    reference: `docs/spec/portfolio-spec.md:85 (no pronouns), ${SC_015}`,
    expected:
      'no I, me, my, mine, myself, he, his, him, himself, she, her, we, our as a word in station copy',
  },
  {
    id: 'content.no-em-dash',
    source: 'owner-2026-10-07',
    reference: `${CONTENT_RULES} §3 (no em dashes)`,
    expected: 'no U+2014 in any copy string',
  },
  {
    id: 'content.no-ai-tells',
    source: 'owner-2026-10-07',
    reference: `${CONTENT_RULES} §3 (no AI tells), copywriting ai-tells reference (bans)`,
    expected: 'no banned AI-tell word or phrase in any copy string',
  },
  {
    id: 'content.numbers.verified',
    source: 'facts',
    reference: `${SC_015} (every number matches the verified list); allow-list in content.facts.numbers.ts, each entry with its build_ats.py line`,
    expected: 'after removing the allow-listed phrases no digit remains in any copy string',
  },
  {
    id: 'content.numbers.allow-list-sourced',
    source: 'facts',
    reference: `${SC_015}; ${CONTENT_RULES} §1 (only the CV source, the memory and the owner)`,
    expected: 'every allow-list entry has a non-empty reference and a source from the allowed set',
  },
  {
    id: 'content.no-need-marker',
    source: 'owner-2026-10-07',
    reference: `${CONTENT_RULES} §1 ([NEED: …] never ships)`,
    expected: 'no «[NEED» marker in any copy string',
  },
  {
    id: 'content.form.status-invalid',
    source: 'spec',
    reference: 'FR-047 (docs/spec/portfolio-spec.md; plan §5.2)',
    expected: '«Message not sent. Check the marked fields.» exactly',
  },
] as const satisfies readonly ContentFactsCase[];

export type ContentFactsCaseId = (typeof CONTENT_FACTS_CASES)[number]['id'];
