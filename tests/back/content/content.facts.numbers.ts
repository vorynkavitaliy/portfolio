export type NumberSource = 'facts' | 'spec' | 'security-md' | 'owner-2026-10-07';

export type AllowedNumber = Readonly<{
  phrase: string;
  source: NumberSource;
  reference: string;
}>;

const CV = '~/Projects/learning/resume/build_ats.py';
const SPEC = 'docs/spec/portfolio-spec.md';
const MEMORY = 'memory career-facts-verified';

export const ALLOWED_NUMBERS: readonly AllowedNumber[] = [
  { phrase: '7+', source: 'facts', reference: `${CV}:16 (7+ years of production experience)` },
  { phrase: '2+', source: 'facts', reference: `${CV}:16 (2+ years as a Tech Lead)` },
  { phrase: '46', source: 'facts', reference: `${CV}:69 (46 pages)` },
  { phrase: '19', source: 'facts', reference: `${CV}:69 (19 business domains)` },
  { phrase: 'AWS S3', source: 'facts', reference: `${CV}:23 (AWS (S3))` },
  { phrase: 'Vue 2', source: 'facts', reference: `${CV}:39 (Vue 2 and Vuex)` },
  { phrase: 'Vue 3', source: 'facts', reference: `${CV}:21 (Vue 3)` },
  { phrase: 'Nuxt 3', source: 'facts', reference: `${CV}:68 (Nuxt 3)` },
  { phrase: 'Tailwind 4', source: 'facts', reference: `${CV}:69 (Tailwind CSS 4)` },
  {
    phrase: '2 client projects',
    source: 'facts',
    reference: `${CV}:45 and :52 (2 client projects)`,
  },
  { phrase: '2 yrs', source: 'facts', reference: `${MEMORY} (Node.js commercially 2 years)` },
  { phrase: '2024–26', source: 'facts', reference: `${CV}:28 (January 2024 to September 2026)` },
  { phrase: '2022–24', source: 'facts', reference: `${CV}:37 (May 2022 to January 2024)` },
  { phrase: '2021–22', source: 'facts', reference: `${CV}:43 (October 2021 to May 2022)` },
  { phrase: '2020–21', source: 'facts', reference: `${CV}:49 (June 2020 to October 2021)` },
  { phrase: '2018–20', source: 'facts', reference: `${CV}:55 (October 2018 to June 2020)` },
  { phrase: '2015–18', source: 'facts', reference: `${CV}:61 (2015 to 2018)` },
  { phrase: 'in 2018', source: 'facts', reference: `${CV}:61 (left the police in 2018)` },
  { phrase: 'Mission 1 of 3', source: 'spec', reference: `${SPEC}:58` },
  { phrase: 'Mission 2 of 3', source: 'spec', reference: `${SPEC}:59` },
  { phrase: 'Mission 3 of 3', source: 'spec', reference: `${SPEC}:60` },
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
