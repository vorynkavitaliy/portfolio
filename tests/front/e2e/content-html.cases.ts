import type { FirstScreenCase } from '@tests/front/e2e/first-screen.cases';

export const CASES = [
  {
    id: 'spec.content-html.no-forbidden-names',
    source: 'spec',
    reference: 'portfolio-spec SC-015; tests/back/content/forbidden.local.json',
    expected: 'the served HTML contains no employer, project or client name',
  },
  {
    id: 'spec.content-html.no-github',
    source: 'spec',
    reference: 'portfolio-spec SC-015; project content rule: no GitHub link',
    expected: 'the served HTML has no github link',
  },
  {
    id: 'spec.content-html.no-phone',
    source: 'spec',
    reference: 'portfolio-spec SC-015',
    expected: 'the served text has no forbidden phone number and no phone-like digit run',
  },
] as const satisfies readonly FirstScreenCase[];

export type ContentHtmlCaseId = (typeof CASES)[number]['id'];
