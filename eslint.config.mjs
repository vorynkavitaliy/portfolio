import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

const listDirs = (dir) => {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => {
      return entry.isDirectory();
    })
    .map((entry) => {
      return entry.name;
    });
};

const SECTIONS = listDirs(join(import.meta.dirname, 'src/sections'));

const DYNAMIC_SOURCES = new Map();

const withDynamicSource = (pattern, source) => {
  DYNAMIC_SOURCES.set(pattern, source);

  return pattern;
};

const NO_RELATIVE_IMPORTS = withDynamicSource(
  {
    group: ['./*', '../*'],
    message: 'Use @/... absolute import (no relative imports).',
  },
  '^\\.{1,2}\\/',
);

const NO_TESTS = withDynamicSource(
  {
    group: ['@tests/*'],
    message: 'Product code must not import test helpers (@tests/*).',
  },
  '^@tests\\/',
);

const forbid = (layer, message) => {
  return withDynamicSource(
    { group: [`@/${layer}`, `@/${layer}/*`], message },
    `^@\\/${layer}(\\/|$)`,
  );
};

const NO_APP = forbid('app', 'Nothing imports from app/.');
const NO_SECTIONS = forbid('sections', 'Only app/ imports sections.');
const NO_SCENE = forbid('scene', 'This layer must not depend on scene/.');
const NO_MOTION = forbid('motion', 'This layer must not depend on motion/.');
const NO_SHARED = forbid('shared', 'This layer must not depend on shared/.');
const NO_CONTENT = forbid('content', 'This layer must not depend on content/.');
const NO_SERVER = forbid('server', 'server/ is imported only from sections/*/actions.');

const NO_CLIENT_FILES = withDynamicSource(
  {
    group: ['@/**/*.client', '@/**/*.client.tsx'],
    message: 'Server code never imports client files.',
  },
  '^@\\/.*\\.client(\\.tsx)?$',
);

const SCENE_ONLY_VIA_LOADER = withDynamicSource(
  {
    regex: '^@/scene(/(?!scene-loader\\.client$).*)?$',
    message: 'Sections reach the scene only through @/scene/scene-loader.client.',
  },
  '^@\\/scene(\\/(?!scene-loader\\.client$).*)?$',
);

const ARBITRARY_TAILWIND_LITERAL = {
  selector: 'Literal[value=/\\[(?:#|rgba\\(|rgb\\(|hsl\\(|[0-9]+(?:\\.[0-9]+)?px\\])/]',
  message: 'Arbitrary Tailwind value detected (hex/rgb/hsl/px). Use a design token from @theme.',
};

const ARBITRARY_TAILWIND_TEMPLATE = {
  selector: 'TemplateElement[value.raw=/\\[(?:#|rgba\\(|rgb\\(|hsl\\(|[0-9]+(?:\\.[0-9]+)?px\\])/]',
  message: 'Arbitrary Tailwind value detected (hex/rgb/hsl/px). Use a design token from @theme.',
};

const LITERAL_INLINE_STYLE = {
  selector:
    "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression > Property[value.type='Literal']",
  message:
    'Inline style={{}} with literal values is forbidden. Use a CSS class or a @theme token; inline styles are for computed values only.',
};

const HARNESS_PATH_LITERAL = {
  selector: 'Literal[value=/(^|[^A-Za-z0-9_])(board|\\.claude)\\//]',
  message: 'Project code and tests never reference board/ or .claude/. Name the source instead.',
};

const HARNESS_PATH_TEMPLATE = {
  selector: 'TemplateElement[value.raw=/(^|[^A-Za-z0-9_])(board|\\.claude)\\//]',
  message: HARNESS_PATH_LITERAL.message,
};

const TEST_RUNNERS = '/^(test|it|describe)$/';

const NO_FOCUSED_TEST = {
  selector: `MemberExpression[object.name=${TEST_RUNNERS}][property.name='only']`,
  message: 'A focused test hides the rest of the suite.',
};

const NO_TODO_TEST = {
  selector: `MemberExpression[object.name=${TEST_RUNNERS}][property.name='todo']`,
  message: 'A case is a test or a catalogue row in state «waits», never a todo.',
};

const NO_DECLARED_SKIP = {
  selector: `CallExpression[callee.object.name=${TEST_RUNNERS}][callee.property.name='skip']:matches([arguments.length<2], [arguments.0.type='Literal'], [arguments.0.type='TemplateLiteral'])`,
  message:
    'Skip only under a runtime condition with a reason: test.skip(condition, reason). A case that cannot run yet is a catalogue row in state «waits».',
};

const NO_WHOLE_TEST_FAIL = {
  selector: 'MemberExpression[object.name=/^(test|it)$/][property.name=/^fails?$/]',
  message:
    'A known bug wraps one assertion (expectKnownBug), never a whole test — testing rule §1.2 p.4.',
};

const TEST_PATTERN = [NO_FOCUSED_TEST, NO_TODO_TEST, NO_DECLARED_SKIP, NO_WHOLE_TEST_FAIL];

const PAGE_ONLY_SYNTAX = [
  {
    selector: "ExpressionStatement > Literal[value='use client']",
    message:
      'page.tsx / layout.tsx must be Server Components. Push interactivity to a *.client.tsx leaf.',
  },
  {
    selector: 'CallExpression[callee.name=/^use[A-Z]/]',
    message: 'Hooks are forbidden in page.tsx / layout.tsx. Move stateful logic into a leaf.',
  },
  {
    selector: 'CallExpression[callee.property.name=/^use[A-Z]/]',
    message: 'Hooks are forbidden in page.tsx / layout.tsx. Move stateful logic into a leaf.',
  },
];

const SRC_SYNTAX = [
  ARBITRARY_TAILWIND_LITERAL,
  ARBITRARY_TAILWIND_TEMPLATE,
  LITERAL_INLINE_STYLE,
  HARNESS_PATH_LITERAL,
  HARNESS_PATH_TEMPLATE,
];

const dynamicImportSelectors = (patterns) => {
  return patterns.flatMap((pattern) => {
    const source = DYNAMIC_SOURCES.get(pattern);

    if (source === undefined) {
      return [];
    }

    return [
      {
        selector: `ImportExpression > Literal[value=/${source}/]`,
        message: pattern.message,
      },
      {
        selector: `ImportExpression > TemplateLiteral > TemplateElement[value.raw=/${source}/]`,
        message: pattern.message,
      },
    ];
  });
};

const restrictImports = (files, patterns, ignores = [], extraSyntax = []) => {
  const all = [NO_RELATIVE_IMPORTS, NO_TESTS, ...patterns];

  return {
    files,
    ignores,
    rules: {
      'no-restricted-imports': ['error', { patterns: all }],
      'no-restricted-syntax': [
        'error',
        ...SRC_SYNTAX,
        ...extraSyntax,
        ...dynamicImportSelectors(all),
      ],
    },
  };
};

const otherSections = (current) => {
  return SECTIONS.filter((name) => {
    return name !== current;
  }).map((name) => {
    return withDynamicSource(
      {
        group: [`@/sections/${name}`, `@/sections/${name}/*`],
        message: 'Sections do not import each other.',
      },
      `^@\\/sections\\/${name}(\\/|$)`,
    );
  });
};

const sectionBlocks = SECTIONS.map((section) => {
  return restrictImports(
    [`src/sections/${section}/**/*.{ts,tsx}`],
    [NO_APP, NO_SERVER, SCENE_ONLY_VIA_LOADER, ...otherSections(section)],
    [`src/sections/${section}/actions/**`],
  );
});

const actionBlocks = SECTIONS.map((section) => {
  return restrictImports(
    [`src/sections/${section}/actions/**/*.{ts,tsx}`],
    [NO_APP, NO_CLIENT_FILES, SCENE_ONLY_VIA_LOADER, ...otherSections(section)],
  );
});

const NEXT_CONVENTION_FILES = [
  'src/app/**/page.tsx',
  'src/app/**/layout.tsx',
  'src/app/**/error.tsx',
  'src/app/**/loading.tsx',
  'src/app/**/not-found.tsx',
  'src/app/**/template.tsx',
  'src/app/**/default.tsx',
  'src/app/**/global-error.tsx',
  'src/app/**/manifest.ts',
  'src/app/**/icon.tsx',
  'src/app/**/apple-icon.tsx',
  'src/app/**/opengraph-image.tsx',
  'src/app/**/twitter-image.tsx',
  'src/app/**/sitemap.ts',
  'src/app/**/robots.ts',
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'node_modules/**',
    'next-env.d.ts',
    '.claude/**',
    'board/**',
    'docs/**',
    '.regression/**',
    'test-results/**',
    'playwright-report/**',
    'blob-report/**',
  ]),
  {
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'always'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'block-like' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: 'block-like' },
        { blankLine: 'always', prev: 'block-like', next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: 'multiline-const', next: '*' },
        { blankLine: 'always', prev: '*', next: 'multiline-const' },
        { blankLine: 'always', prev: 'multiline-let', next: '*' },
        { blankLine: 'always', prev: '*', next: 'multiline-let' },
        { blankLine: 'always', prev: 'multiline-expression', next: '*' },
        { blankLine: 'always', prev: '*', next: 'multiline-expression' },
      ],
      'no-restricted-imports': ['error', { patterns: [NO_RELATIVE_IMPORTS, NO_TESTS] }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.mts', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'error',
    },
  },
  {
    files: ['src/**/*.tsx', 'tests/**/*.tsx'],
    rules: {
      'react/jsx-newline': ['error', { prevent: false }],
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  {
    files: ['scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ARBITRARY_TAILWIND_LITERAL,
        ARBITRARY_TAILWIND_TEMPLATE,
        LITERAL_INLINE_STYLE,
        HARNESS_PATH_LITERAL,
        HARNESS_PATH_TEMPLATE,
      ],
      'import/no-default-export': 'error',
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ARBITRARY_TAILWIND_LITERAL,
        ARBITRARY_TAILWIND_TEMPLATE,
        LITERAL_INLINE_STYLE,
        HARNESS_PATH_LITERAL,
        HARNESS_PATH_TEMPLATE,
        ...TEST_PATTERN,
      ],
    },
  },
  {
    files: ['scripts/**/*.mts'],
    rules: {
      'no-restricted-syntax': ['error', HARNESS_PATH_LITERAL, HARNESS_PATH_TEMPLATE],
    },
  },
  {
    files: NEXT_CONVENTION_FILES,
    rules: {
      'import/no-default-export': 'off',
    },
  },
  restrictImports(['src/app/**/*.{ts,tsx}'], [NO_SCENE, NO_SERVER]),
  ...sectionBlocks,
  ...actionBlocks,
  restrictImports(
    ['src/scene/**/*.{ts,tsx}'],
    [NO_APP, NO_SECTIONS, NO_CONTENT, NO_SHARED, NO_SERVER],
  ),
  restrictImports(
    ['src/motion/**/*.{ts,tsx}'],
    [NO_APP, NO_SECTIONS, NO_SCENE, NO_CONTENT, NO_SHARED, NO_SERVER],
  ),
  restrictImports(
    ['src/shared/**/*.{ts,tsx}'],
    [NO_APP, NO_SECTIONS, NO_SCENE, NO_CONTENT, NO_SERVER],
  ),
  restrictImports(
    ['src/content/**/*.{ts,tsx}'],
    [NO_APP, NO_SECTIONS, NO_SCENE, NO_MOTION, NO_SHARED, NO_SERVER],
  ),
  restrictImports(
    ['src/core/**/*.{ts,tsx}'],
    [NO_APP, NO_SECTIONS, NO_SCENE, NO_MOTION, NO_SHARED, NO_CONTENT, NO_SERVER],
  ),
  restrictImports(
    ['src/server/**/*.{ts,tsx}'],
    [NO_APP, NO_SECTIONS, NO_SCENE, NO_MOTION, NO_SHARED, NO_CONTENT, NO_CLIENT_FILES],
  ),
  restrictImports(
    ['src/app/**/page.tsx', 'src/app/**/layout.tsx'],
    [NO_SCENE, NO_SERVER],
    [],
    PAGE_ONLY_SYNTAX,
  ),
  {
    files: ['tests/**/*.{ts,tsx}', 'scripts/**/*.mts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [NO_RELATIVE_IMPORTS, NO_APP] }],
    },
  },
]);

export default eslintConfig;
