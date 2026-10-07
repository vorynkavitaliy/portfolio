import type { FillTemplateCaseId } from '@tests/back/core/text/fill-template.cases';

export type FillTemplateMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly FillTemplateCaseId[];
}>;

const FILE = 'src/core/text/fill-template.ts';

export const FILL_TEMPLATE_MUTATIONS: readonly FillTemplateMutation[] = [
  {
    id: 'regex.first-only',
    file: FILE,
    find: '/\\{([^{}]+)\\}/g',
    replace: '/\\{([^{}]+)\\}/',
    caseIds: ['text.fill.repeated', 'text.fill.multiple', 'text.fill.unknown'],
  },
  {
    id: 'unknown.blanked',
    file: FILE,
    find: 'value === undefined ? match : String(value)',
    replace: "value === undefined ? '' : String(value)",
    caseIds: ['text.fill.unknown', 'text.fill.inherited-keys'],
  },
  {
    id: 'zero-is-missing',
    file: FILE,
    find: 'value === undefined ? match : String(value)',
    replace: 'value ? String(value) : match',
    caseIds: ['text.fill.zero'],
  },
  {
    id: 'inherited-members-used',
    file: FILE,
    find: 'Object.hasOwn(values, key)',
    replace: 'key in values',
    caseIds: ['text.fill.inherited-keys'],
  },
  {
    id: 'braces-allowed-in-key',
    file: FILE,
    find: '[^{}]+',
    replace: '[^}]+',
    caseIds: ['text.fill.single-braces'],
  },
  {
    id: 'empty-key-allowed',
    file: FILE,
    find: '[^{}]+',
    replace: '[^{}]*',
    caseIds: ['text.fill.single-braces'],
  },
  {
    id: 'reexpand',
    file: FILE,
    find: 'return template.replace(',
    replace: 'return fillTemplate(template, values).replace(',
    caseIds: ['text.fill.counter'],
  },
  {
    id: 'value-not-stringified-trimmed',
    file: FILE,
    find: 'String(value)',
    replace: 'String(value).trim().slice(0, 3)',
    caseIds: ['text.fill.string-value'],
  },
];
