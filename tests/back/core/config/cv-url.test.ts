import { expect, vi } from 'vitest';

import { caseTest } from '@tests/back/core/config/cv-url.case-test';
import { getCvHref, parseCvHref } from '@/core/config/cv-url';

caseTest('cv.url.unset-is-null', 'no variable', () => {
  expect(parseCvHref({})).toBeNull();
});

caseTest('cv.url.blank-is-null', 'empty and whitespace', () => {
  expect(parseCvHref({ CV_URL: '' })).toBeNull();
  expect(parseCvHref({ CV_URL: '   ' })).toBeNull();
});

caseTest('cv.url.valid', 'https and http pass through', () => {
  expect(parseCvHref({ CV_URL: 'https://files.example.test/cv.pdf' })).toBe(
    'https://files.example.test/cv.pdf',
  );

  expect(parseCvHref({ CV_URL: 'http://files.example.test/cv.pdf' })).toBe(
    'http://files.example.test/cv.pdf',
  );
});

caseTest('cv.url.invalid-throws', 'names CV_URL only', () => {
  const secretValue = 'not-a-url-zq81';

  expect(() => {
    parseCvHref({ CV_URL: secretValue });
  }).toThrow('Invalid server environment: CV_URL');

  expect(() => {
    parseCvHref({ CV_URL: secretValue });
  }).not.toThrow(secretValue);
});

caseTest('cv.url.scheme-restricted', 'javascript, data and ftp rejected', () => {
  for (const value of [
    'javascript:alert(1)',
    'data:text/html,hello',
    'ftp://files.example.test/cv.pdf',
  ]) {
    expect(() => {
      parseCvHref({ CV_URL: value });
    }).toThrow('Invalid server environment: CV_URL');
  }
});

caseTest('cv.url.get-reads-process-env', 'stubbed env is seen', () => {
  vi.stubEnv('CV_URL', 'https://files.example.test/cv.pdf');

  expect(getCvHref()).toBe('https://files.example.test/cv.pdf');
});
