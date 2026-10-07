import type { CvUrlCaseId } from '@tests/back/core/config/cv-url.cases';

export type CvUrlMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly CvUrlCaseId[];
}>;

const CV = 'src/core/config/cv-url.ts';

export const CV_URL_MUTATIONS: readonly CvUrlMutation[] = [
  {
    id: 'unset.not-null',
    file: CV,
    find: "(source['CV_URL'] ?? '')",
    replace: "(source['CV_URL'] ?? 'https://x.test')",
    caseIds: ['cv.url.unset-is-null'],
  },
  {
    id: 'blank.rejected',
    file: CV,
    find: "if (raw === '') {",
    replace: "if (raw === 'x') {",
    caseIds: ['cv.url.blank-is-null'],
  },
  {
    id: 'untrimmed',
    file: CV,
    find: "?? '').trim()",
    replace: "?? '')",
    caseIds: ['cv.url.blank-is-null'],
  },
  {
    id: 'valid.dropped',
    file: CV,
    find: 'return parsed.data;',
    replace: 'return null;',
    caseIds: ['cv.url.valid'],
  },
  {
    id: 'invalid.null',
    file: CV,
    find: "throw new Error('Invalid server environment: CV_URL');",
    replace: 'return null;',
    caseIds: ['cv.url.invalid-throws', 'cv.url.scheme-restricted'],
  },
  {
    id: 'scheme.any',
    file: CV,
    find: 'z.url({ protocol: /^https?$/ })',
    replace: 'z.url()',
    caseIds: ['cv.url.scheme-restricted'],
  },
  {
    id: 'get.ignores-env',
    file: CV,
    find: 'parseCvHref(process.env)',
    replace: 'parseCvHref({})',
    caseIds: ['cv.url.get-reads-process-env'],
  },
];
