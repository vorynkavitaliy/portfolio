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
    find: 'Have an idea, a role or a project?',
    replace: 'Have an idea, a role or a github project?',
    caseIds: ['content.no-github', 'content.forbidden.terms'],
  },
  {
    id: 'llm-pipeline-word',
    file: STATIONS,
    find: 'Builds the frontend and the backend.',
    replace: 'Builds the frontend and the backend with a pipeline.',
    caseIds: ['content.full-cycle.no-internals', 'content.forbidden.terms'],
  },
  {
    id: 'llm-minute-word',
    file: STATIONS,
    find: 'Adds AI when the product needs it.',
    replace: 'Adds AI in a minute when the product needs it.',
    caseIds: ['content.full-cycle.no-internals'],
  },
  {
    id: 'first-person-pronoun',
    file: STATIONS,
    find: 'Builds web products end to end',
    replace: 'I build web products end to end',
    caseIds: ['content.station-copy.no-pronouns'],
  },
  {
    id: 'em-dash',
    file: STATIONS,
    find: 'Takes an idea from zero to a working',
    replace: 'Takes an idea from zero — to a working',
    caseIds: ['content.no-em-dash'],
  },
  {
    id: 'ai-tell-word',
    file: STATIONS,
    find: "title: 'From idea to production'",
    replace: "title: 'From idea to seamless production'",
    caseIds: ['content.no-ai-tells'],
  },
  {
    id: 'unverified-number',
    file: STATIONS,
    find: 'Lighthouse SEO 100',
    replace: 'Lighthouse SEO 101',
    caseIds: ['content.numbers.verified'],
  },
  {
    id: 'need-marker',
    file: STATIONS,
    find: "label: 'Backend'",
    replace: "label: '[NEED: label]'",
    caseIds: ['content.no-need-marker'],
  },
  {
    id: 'phone-shaped-number',
    file: STATIONS,
    find: 'Have an idea, a role or a project?',
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
