export type NumberSource =
  'facts' | 'spec' | 'security-md' | 'owner-2026-10-07' | 'owner-2026-10-08';

export type AllowedNumber = Readonly<{
  phrase: string;
  source: NumberSource;
  reference: string;
}>;

const CV = '~/Projects/learning/resume/build_ats.py';
const SPEC = 'docs/spec/portfolio-spec.md';

const COPY_V2 = 'owner-approved copy v2 (2026-10-08)';

export const ALLOWED_NUMBERS: readonly AllowedNumber[] = [
  { phrase: '7+', source: 'facts', reference: `${CV}:16 (7+ years of production experience)` },
  { phrase: '20+', source: 'owner-2026-10-08', reference: `${COPY_V2}: 20+ projects` },
  { phrase: '600+', source: 'owner-2026-10-08', reference: `${COPY_V2}: 600+ translation keys` },
  { phrase: '100', source: 'owner-2026-10-08', reference: `${COPY_V2}: Lighthouse score 100` },
  { phrase: 'AWS S3', source: 'facts', reference: `${CV}:23 (AWS (S3))` },
  { phrase: 'Vue 3', source: 'facts', reference: `${CV}:21 (Vue 3)` },
  { phrase: 'Nuxt 3', source: 'facts', reference: `${CV}:68 (Nuxt 3)` },
  {
    phrase: '1 + AI',
    source: 'owner-2026-10-07',
    reference: 'owner brief 2026-10-07: site built by one developer with an AI assistant',
  },
  { phrase: '3D', source: 'spec', reference: `${SPEC}:103 (FR-006, the «3D world» button)` },
  {
    phrase: '10 characters',
    source: 'security-md',
    reference: 'security-md §1 (message 10–4000)',
  },
  {
    phrase: 'linkedin.com/in/vitaliy-vorynka-7b6005142',
    source: 'facts',
    reference: `${CV}:15 (LinkedIn address)`,
  },
];

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const numericTokens = (text: string): readonly string[] => {
  const stripped: string = [...ALLOWED_NUMBERS]
    .sort((a, b) => {
      return b.phrase.length - a.phrase.length;
    })
    .reduce((rest, entry) => {
      return rest.replace(new RegExp(`(?<!\\d)${escapeRegExp(entry.phrase)}(?!\\d)`, 'g'), ' ');
    }, text);

  return stripped.match(/\d+/g) ?? [];
};
