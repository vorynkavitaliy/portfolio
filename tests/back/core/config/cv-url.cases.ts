export type CvUrlCaseSource = 'security-md' | 'owner-2026-10-07';

export type CvUrlCase = Readonly<{
  id: string;
  source: CvUrlCaseSource;
  reference: string;
  expected: string;
}>;

const CONTRACT = 'plan 0002 §7 «Env»: getCvHref() is z.url().optional() mapped to string | null';

const VALIDATION = 'rules/security.md §1 (validate every runtime input with zod)';

export const CV_URL_CASES = [
  {
    id: 'cv.url.unset-is-null',
    source: 'owner-2026-10-07',
    reference: CONTRACT,
    expected: 'without CV_URL the href is null',
  },
  {
    id: 'cv.url.blank-is-null',
    source: 'owner-2026-10-07',
    reference: '.env.example lists names with empty values; empty CV_URL counts as unset (O-3)',
    expected: 'an empty or whitespace CV_URL gives null',
  },
  {
    id: 'cv.url.valid',
    source: 'owner-2026-10-07',
    reference: CONTRACT,
    expected: 'an https and an http URL are returned as given',
  },
  {
    id: 'cv.url.invalid-throws',
    source: 'security-md',
    reference: VALIDATION,
    expected: 'a CV_URL that is not a URL throws naming CV_URL, without echoing the value',
  },
  {
    id: 'cv.url.scheme-restricted',
    source: 'security-md',
    reference: `${VALIDATION}; the value becomes an href`,
    expected: 'a CV_URL with the javascript, data or ftp scheme throws',
  },
  {
    id: 'cv.url.get-reads-process-env',
    source: 'owner-2026-10-07',
    reference: CONTRACT,
    expected: 'getCvHref reads CV_URL from process.env at call time',
  },
] as const satisfies readonly CvUrlCase[];

export type CvUrlCaseId = (typeof CV_URL_CASES)[number]['id'];
