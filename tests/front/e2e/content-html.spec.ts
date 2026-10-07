import { expect, test } from '@playwright/test';

import {
  containsTerm,
  forbiddenNames,
  loadForbiddenList,
} from '@tests/back/content/content.facts.support';

import type { ContentHtmlCaseId } from '@tests/front/e2e/content-html.cases';

const caseTitle = (id: ContentHtmlCaseId, description: string): string => {
  return `${id}: ${description}`;
};

const MIN_PHONE_DIGITS = 9;
const PHONE_LIKE = /\+?\d[\d\s().-]{7,}\d/g;

const visibleText = (html: string): string => {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/g, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
};

const digitsOf = (value: string): string => {
  return value.replace(/\D/g, '');
};

test(caseTitle('spec.content-html.no-forbidden-names', 'none present'), async ({ request }) => {
  const html: string = await (await request.get('/')).text();
  const list = loadForbiddenList();

  const found: number[] = forbiddenNames(list)
    .map((name, index) => {
      return containsTerm(html, name) ? index : -1;
    })
    .filter((index) => {
      return index >= 0;
    });

  expect(found).toEqual([]);
});

test(caseTitle('spec.content-html.no-github', 'none present'), async ({ request }) => {
  const html: string = await (await request.get('/')).text();

  expect(html.toLowerCase()).not.toContain('github');
});

test(caseTitle('spec.content-html.no-phone', 'none present'), async ({ request }) => {
  const html: string = await (await request.get('/')).text();
  const text: string = visibleText(html);
  const list = loadForbiddenList();

  const digits: string = digitsOf(text);

  const leaked: number[] = list.phones
    .map((phone, index) => {
      return digits.includes(phone) ? index : -1;
    })
    .filter((index) => {
      return index >= 0;
    });

  expect(leaked).toEqual([]);

  const phoneLike: string[] = (text.match(PHONE_LIKE) ?? []).filter((match) => {
    return digitsOf(match).length >= MIN_PHONE_DIGITS;
  });

  expect(phoneLike).toEqual([]);
});
