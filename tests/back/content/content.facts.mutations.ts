import type { ContentFactsCaseId } from '@tests/back/content/content.facts.cases';

export type ContentFactsMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly ContentFactsCaseId[];
}>;

const STATIONS = 'src/content/stations.content.ts';
const FORM = 'src/content/contact-form.content.ts';
const SUPPORT = 'tests/back/content/content.facts.support.ts';

export const CONTENT_FACTS_MUTATIONS: readonly ContentFactsMutation[] = [
  {
    id: 'github-mention',
    file: STATIONS,
    find: 'A role or a project in mind?',
    replace: 'A role or a github project in mind?',
    caseIds: ['content.no-github', 'content.forbidden.terms'],
  },
  {
    id: 'llm-pipeline-word',
    file: STATIONS,
    find: 'Code review, refactoring plans and technology choices.',
    replace: 'Code review, refactoring plans and a pipeline.',
    caseIds: ['content.llm-product.no-internals', 'content.forbidden.terms'],
  },
  {
    id: 'llm-minute-word',
    file: STATIONS,
    find: 'delivered as the tech lead',
    replace: 'delivered in a minute as the tech lead',
    caseIds: ['content.llm-product.no-internals'],
  },
  {
    id: 'first-person-pronoun',
    file: STATIONS,
    find: 'Builds interfaces and the services behind them.',
    replace: 'I build interfaces and the services behind them.',
    caseIds: ['content.station-copy.no-pronouns'],
  },
  {
    id: 'em-dash',
    file: STATIONS,
    find: 'Frontend first, backend when',
    replace: 'Frontend first — backend when',
    caseIds: ['content.no-em-dash'],
  },
  {
    id: 'ai-tell-word',
    file: STATIONS,
    find: "title: 'Builds with agent workflows'",
    replace: "title: 'Builds with seamless agent workflows'",
    caseIds: ['content.no-ai-tells'],
  },
  {
    id: 'unverified-number',
    file: STATIONS,
    find: 'across 19 business',
    replace: 'across 21 business',
    caseIds: ['content.numbers.verified'],
  },
  {
    id: 'fourth-mission-tag',
    file: STATIONS,
    find: "tag: 'Mission 3 of 3'",
    replace: "tag: 'Mission 3 of 4'",
    caseIds: ['content.missions.exactly-three', 'content.numbers.verified'],
  },
  {
    id: 'need-marker',
    file: STATIONS,
    find: "label: 'Admin app'",
    replace: "label: '[NEED: label]'",
    caseIds: ['content.no-need-marker'],
  },
  {
    id: 'phone-shaped-number',
    file: STATIONS,
    find: 'A role or a project in mind?',
    replace: 'Call +1 555 010 9999.',
    caseIds: ['content.no-phone', 'content.numbers.verified'],
  },
  {
    id: 'status-invalid-wording',
    file: FORM,
    find: 'Check the marked fields.',
    replace: 'Check the fields.',
    caseIds: ['content.form.status-invalid'],
  },
  {
    id: 'missing-file-silent',
    file: SUPPORT,
    find: 'if (!existsSync(path)) {',
    replace: 'if (false) {',
    caseIds: ['content.forbidden.missing-file-fails-loudly'],
  },
  {
    id: 'term-not-case-insensitive',
    file: SUPPORT,
    find: "'iu')",
    replace: "'u')",
    caseIds: ['content.term-matching.word-aware'],
  },
  {
    id: 'term-not-word-aware',
    file: SUPPORT,
    find: '(?<![\\\\p{L}\\\\p{N}])',
    replace: '',
    caseIds: ['content.term-matching.word-aware'],
  },
];
