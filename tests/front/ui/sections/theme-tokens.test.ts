import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

const css: string = readFileSync(join(process.cwd(), 'src/core/styles/globals.css'), 'utf8');

const namesOf = (namespace: string): readonly string[] => {
  return [...css.matchAll(new RegExp(`--${namespace}-([a-z0-9-]+):`, 'g'))].flatMap((match) => {
    const [, name = ''] = match;

    return name === '' ? [] : [name];
  });
};

test('theme.tokens.text-namespace: no font-size token shares a name with a colour token', () => {
  const colours: ReadonlySet<string> = new Set(namesOf('color'));
  const clashes: readonly string[] = namesOf('text').filter((name) => {
    return colours.has(name);
  });

  expect(namesOf('text').length).toBeGreaterThan(0);
  expect(clashes).toEqual([]);
});
