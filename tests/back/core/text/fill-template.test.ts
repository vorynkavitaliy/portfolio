import { expect } from 'vitest';

import { caseTest } from '@tests/back/core/text/fill-template.case-test';
import { fillTemplate } from '@/core/text/fill-template';

caseTest('text.fill.counter', 'Linked 4/9', () => {
  expect(fillTemplate('Linked {n}/9', { n: 4 })).toBe('Linked 4/9');
});

caseTest('text.fill.string-value', 'strings are inserted', () => {
  expect(fillTemplate('Hello {name}', { name: 'Vitalii' })).toBe('Hello Vitalii');
});

caseTest('text.fill.zero', 'zero is printed', () => {
  expect(fillTemplate('Linked {n}/9', { n: 0 })).toBe('Linked 0/9');
});

caseTest('text.fill.repeated', 'every occurrence is replaced', () => {
  expect(fillTemplate('{a}-{a}', { a: 'x' })).toBe('x-x');
});

caseTest('text.fill.multiple', 'several keys', () => {
  expect(fillTemplate('{a} of {b}', { a: 2, b: 9 })).toBe('2 of 9');
});

caseTest('text.fill.unknown', 'unknown keys stay', () => {
  expect(fillTemplate('Hi {who}, {n}', { n: 1 })).toBe('Hi {who}, 1');
});

caseTest('text.fill.no-placeholders', 'plain text is unchanged', () => {
  expect(fillTemplate('plain text', { n: 1 })).toBe('plain text');
  expect(fillTemplate('', { n: 1 })).toBe('');
});

caseTest('text.fill.no-reexpansion', 'values are not expanded again', () => {
  expect(fillTemplate('{a}', { a: '{b}', b: 'x' })).toBe('{b}');
});

caseTest('text.fill.inherited-keys', 'prototype members are not values', () => {
  expect(fillTemplate('{constructor} {toString} {__proto__}', {})).toBe(
    '{constructor} {toString} {__proto__}',
  );
});

caseTest('text.fill.single-braces', 'unmatched braces stay', () => {
  expect(fillTemplate('a { b } {', {})).toBe('a { b } {');
  expect(fillTemplate('{}', { '': 'x' })).toBe('{}');
  expect(fillTemplate('{{a}}', { a: 'x' })).toBe('{x}');
});
