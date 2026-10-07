export type FillTemplateCaseSource = 'spec' | 'owner-2026-10-07';

export type FillTemplateCase = Readonly<{
  id: string;
  source: FillTemplateCaseSource;
  reference: string;
  expected: string;
}>;

const COUNTER = 'FR-027 (the counter reads «Linked n/9»)';

export const FILL_TEMPLATE_CASES = [
  {
    id: 'text.fill.counter',
    source: 'spec',
    reference: COUNTER,
    expected: 'fillTemplate("Linked {n}/9", { n: 4 }) = "Linked 4/9"',
  },
  {
    id: 'text.fill.string-value',
    source: 'spec',
    reference: COUNTER,
    expected:
      'a string value is inserted as is: "Hello {name}" with { name: "Vitalii" } = "Hello Vitalii"',
  },
  {
    id: 'text.fill.zero',
    source: 'spec',
    reference: COUNTER,
    expected: 'the number 0 is printed: "Linked {n}/9" with { n: 0 } = "Linked 0/9"',
  },
  {
    id: 'text.fill.repeated',
    source: 'owner-2026-10-07',
    reference: 'plan §5.1: replaces {key}',
    expected: 'every occurrence of a key is replaced: "{a}-{a}" with { a: "x" } = "x-x"',
  },
  {
    id: 'text.fill.multiple',
    source: 'owner-2026-10-07',
    reference: 'plan §5.1: replaces {key}',
    expected: '"{a} of {b}" with { a: 2, b: 9 } = "2 of 9"',
  },
  {
    id: 'text.fill.unknown',
    source: 'owner-2026-10-07',
    reference: 'plan §5.1: unknown keys stay as written',
    expected: '"Hi {who}, {n}" with { n: 1 } = "Hi {who}, 1"',
  },
  {
    id: 'text.fill.no-placeholders',
    source: 'owner-2026-10-07',
    reference: 'plan §5.1',
    expected: 'a template without braces is returned unchanged; the empty string stays empty',
  },
  {
    id: 'text.fill.no-reexpansion',
    source: 'owner-2026-10-07',
    reference: 'plan §5.1: replaces {key} once',
    expected:
      'a value that itself contains {b} is not expanded: "{a}" with { a: "{b}", b: "x" } = "{b}"',
  },
  {
    id: 'text.fill.inherited-keys',
    source: 'owner-2026-10-07',
    reference: 'plan §5.1: unknown keys stay as written (inherited object members are not values)',
    expected: '"{constructor} {toString} {__proto__}" with {} stays unchanged',
  },
  {
    id: 'text.fill.single-braces',
    source: 'owner-2026-10-07',
    reference: 'plan §5.1',
    expected:
      'unmatched braces stay: "a { b } {" with {} = "a { b } {"; an empty "{}" stays even when a key "" exists; nested "{{a}}" with { a: "x" } = "{x}"',
  },
] as const satisfies readonly FillTemplateCase[];

export type FillTemplateCaseId = (typeof FILL_TEMPLATE_CASES)[number]['id'];
