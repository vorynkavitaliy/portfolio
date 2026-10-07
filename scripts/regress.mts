import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { z } from 'zod';

type Suite = 'ui' | 'server' | 'e2e';

type Failure = {
  suite: Suite;
  caseId: string;
  title: string;
  file: string;
  line: number | undefined;
  message: string;
};

type StepResult = {
  name: string;
  exitCode: number;
  skipped: string | undefined;
};

const ROOT: string = process.cwd();
const OUTPUT_DIR: string = resolve(ROOT, '.regression');
const REPORT_FILE: string = resolve(OUTPUT_DIR, 'report.md');
const SOURCELESS_MARK = /id:\s*['`]([^'`]+)['`],[^{}]*?source:\s*'code-branch'/g;
const FIXED_BUG_MARK = /Expect test to fail|known bug \S+ no longer reproduces/;
const TEST_FILE = /\.(test|spec)\.tsx?$/;

const vitestReport = z.object({
  testResults: z.array(
    z.object({
      name: z.string(),
      assertionResults: z.array(
        z.object({
          title: z.string(),
          status: z.string(),
          failureMessages: z.array(z.string()).optional(),
          location: z.object({ line: z.number() }).optional(),
        }),
      ),
    }),
  ),
});

const mutationsReport = z.object({
  totals: z.record(z.string(), z.number()),
  results: z.array(
    z.object({
      id: z.string(),
      table: z.string(),
      file: z.string(),
      verdict: z.string(),
      claimedCaseIds: z.array(z.string()),
      missingCaseIds: z.array(z.string()),
      failedTests: z.number(),
      failedTestTitles: z.array(z.string()),
      unclaimedFailedTitles: z.array(z.string()),
      loadErrors: z.array(z.string()),
      note: z.string(),
    }),
  ),
});

const playwrightTest = z.object({
  results: z.array(z.object({ error: z.object({ message: z.string().optional() }).optional() })),
});

const playwrightNode: z.ZodType<PlaywrightNode> = z.lazy(() => {
  return z.object({
    title: z.string().optional(),
    file: z.string().optional(),
    line: z.number().optional(),
    ok: z.boolean().optional(),
    tests: z.array(playwrightTest).optional(),
    specs: z.array(playwrightNode).optional(),
    suites: z.array(playwrightNode).optional(),
  });
});

type PlaywrightNode = {
  title?: string | undefined;
  file?: string | undefined;
  line?: number | undefined;
  ok?: boolean | undefined;
  tests?: z.infer<typeof playwrightTest>[] | undefined;
  specs?: PlaywrightNode[] | undefined;
  suites?: PlaywrightNode[] | undefined;
};

class RunAborted extends Error {}

const run = (
  command: string,
  args: readonly string[],
  env: Record<string, string> = {},
): number => {
  console.log(`\n$ ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });

  const interrupted: boolean =
    result.signal === 'SIGINT' ||
    result.signal === 'SIGTERM' ||
    result.status === 130 ||
    result.status === 143;

  if (interrupted) {
    throw new RunAborted();
  }

  return result.status ?? 1;
};

const hasTests = (dir: string): boolean => {
  const absolute: string = resolve(ROOT, dir);

  if (!existsSync(absolute)) {
    return false;
  }

  return readdirSync(absolute, { recursive: true, encoding: 'utf8' }).some((name: string) => {
    return TEST_FILE.test(name);
  });
};

const caseIdOf = (title: string): string => {
  const separator: number = title.indexOf(': ');

  return separator === -1 ? title : title.slice(0, separator);
};

const findLine = (file: string, title: string): number | undefined => {
  const marker: string = caseIdOf(title);
  const lines: string[] = readFileSync(file, 'utf8').split('\n');

  const index: number = lines.findIndex((line: string) => {
    return line.includes(marker);
  });

  return index === -1 ? undefined : index + 1;
};

const readVitest = (
  suite: Suite,
  reportFile: string,
): { failures: Failure[]; fixed: Failure[] } => {
  const failures: Failure[] = [];
  const fixed: Failure[] = [];

  if (!existsSync(reportFile)) {
    return { failures, fixed };
  }

  const report = vitestReport.parse(JSON.parse(readFileSync(reportFile, 'utf8')));

  for (const file of report.testResults) {
    for (const assertion of file.assertionResults) {
      if (assertion.status !== 'failed') {
        continue;
      }

      const message: string = (assertion.failureMessages ?? []).join('\n').split('\n')[0] ?? '';

      const entry: Failure = {
        suite,
        caseId: caseIdOf(assertion.title),
        title: assertion.title,
        file: relative(ROOT, file.name),
        line: assertion.location?.line ?? findLine(file.name, assertion.title),
        message,
      };

      (FIXED_BUG_MARK.test(message) ? fixed : failures).push(entry);
    }
  }

  return { failures, fixed };
};

const collectPlaywright = (
  node: PlaywrightNode,
  suite: Suite,
  acc: { failures: Failure[]; fixed: Failure[] },
): { failures: Failure[]; fixed: Failure[] } => {
  for (const spec of node.specs ?? []) {
    if (spec.ok === false) {
      const message: string =
        (spec.tests ?? [])
          .flatMap((entry) => {
            return entry.results;
          })
          .map((result) => {
            return result.error?.message ?? '';
          })
          .find((text: string) => {
            return text !== '';
          }) ?? '';

      const entry: Failure = {
        suite,
        caseId: caseIdOf(spec.title ?? ''),
        title: spec.title ?? '',
        file: spec.file ?? node.file ?? '',
        line: spec.line,
        message,
      };

      (FIXED_BUG_MARK.test(message) ? acc.fixed : acc.failures).push(entry);
    }
  }

  for (const child of node.suites ?? []) {
    collectPlaywright(child, suite, acc);
  }

  return acc;
};

const readPlaywright = (
  suite: Suite,
  reportFile: string,
): { failures: Failure[]; fixed: Failure[] } => {
  if (!existsSync(reportFile)) {
    return { failures: [], fixed: [] };
  }

  const root = playwrightNode.parse(JSON.parse(readFileSync(reportFile, 'utf8')));

  return collectPlaywright(root, suite, { failures: [], fixed: [] });
};

const groupOf = (failure: Failure): number => {
  if (failure.caseId.startsWith('sec.')) {
    return 0;
  }

  const isA11y: boolean = failure.caseId.startsWith('wcag.') || failure.caseId.startsWith('a11y.');

  return isA11y ? 1 : 2;
};

const GROUP_TITLES: readonly string[] = ['Безопасность', 'Доступность', 'Остальное'];

const renderFailures = (failures: readonly Failure[]): string[] => {
  if (failures.length === 0) {
    return ['Нет.', ''];
  }

  const lines: string[] = [];

  for (let group = 0; group < GROUP_TITLES.length; group += 1) {
    const inGroup: Failure[] = failures.filter((failure: Failure) => {
      return groupOf(failure) === group;
    });

    if (inGroup.length === 0) {
      continue;
    }

    lines.push(`#### ${GROUP_TITLES[group] ?? ''}`, '');

    for (const failure of inGroup) {
      const where: string =
        failure.line === undefined ? failure.file : `${failure.file}:${failure.line}`;

      lines.push(
        `- \`${failure.caseId}\` — ${where} (${failure.suite})${failure.message === '' ? '' : `: ${failure.message}`}`,
      );
    }

    lines.push('');
  }

  return lines;
};

const walkCases = (dir: string, acc: string[]): string[] => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path: string = join(dir, entry.name);

    if (entry.isDirectory()) {
      walkCases(path, acc);

      continue;
    }

    if (entry.name.endsWith('.cases.ts')) {
      acc.push(path);
    }
  }

  return acc;
};

const sourcelessCases = (): string[] => {
  const found: string[] = [];

  for (const file of walkCases(resolve(ROOT, 'tests'), [])) {
    for (const match of readFileSync(file, 'utf8').matchAll(SOURCELESS_MARK)) {
      found.push(`${match[1] ?? ''} — ${relative(ROOT, file)}`);
    }
  }

  return found;
};

const shuffleSeed: number = Math.floor(Math.random() * 1_000_000);

const execute = (mutationsFile: string): number => {
  const args: string[] = process.argv.slice(2);
  const all: boolean = args.includes('--all');
  const refIndex: number = args.indexOf('--changed');
  const ref: string = refIndex === -1 ? 'HEAD' : (args[refIndex + 1] ?? 'HEAD');

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const steps: StepResult[] = [];
  const failures: Failure[] = [];
  const fixed: Failure[] = [];

  steps.push({
    name: 'verify',
    exitCode: run('npm', ['run', 'verify']),
    skipped: undefined,
  });

  for (const suite of ['ui', 'server'] as const) {
    const reportFile: string = join(OUTPUT_DIR, `${suite}.json`);

    const exitCode: number = run('npm', [
      'run',
      `test:${suite}`,
      '--',
      '--sequence.shuffle',
      `--sequence.seed=${shuffleSeed}`,
      '--reporter=default',
      '--reporter=json',
      `--outputFile.json=${reportFile}`,
    ]);

    const parsed = readVitest(suite, reportFile);

    failures.push(...parsed.failures);
    fixed.push(...parsed.fixed);
    steps.push({ name: `test:${suite}`, exitCode, skipped: undefined });
  }

  for (const [suite, dir] of [['e2e', 'tests/front/e2e']] as const) {
    if (!hasTests(dir)) {
      steps.push({ name: suite, exitCode: 0, skipped: 'тестов ещё нет' });

      continue;
    }

    const reportFile: string = join(OUTPUT_DIR, `${suite}.json`);

    const exitCode: number = run('npx', ['playwright', 'test', dir, '--reporter=json'], {
      PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile,
    });

    const browser = readPlaywright(suite, reportFile);

    failures.push(...browser.failures);
    fixed.push(...browser.fixed);
    steps.push({ name: suite, exitCode, skipped: undefined });
  }

  const baselineRed: boolean = steps.some((step: StepResult) => {
    return step.name.startsWith('test:') && step.exitCode !== 0;
  });

  const mutationArgs: string[] = all ? [] : ['--changed', ref];

  if (baselineRed) {
    steps.push({
      name: 'mutations',
      exitCode: 0,
      skipped: 'тесты красные, мутации не имеют смысла',
    });
  } else {
    steps.push({
      name: 'mutations',
      exitCode: run('node', [
        '--import',
        'tsx',
        'scripts/mutate.mts',
        '--output',
        relative(ROOT, mutationsFile),
        ...mutationArgs,
      ]),
      skipped: undefined,
    });
  }

  const mutationsRan: boolean = !baselineRed && existsSync(mutationsFile);

  const mutations = mutationsRan
    ? mutationsReport.parse(JSON.parse(readFileSync(mutationsFile, 'utf8')))
    : undefined;

  const results = mutations?.results ?? [];

  const survivors = results.filter((result) => {
    return result.verdict === 'survived';
  });

  const wrongKills = results.filter((result) => {
    return result.verdict === 'wrong-kill';
  });

  const nowKilled = results.filter((result) => {
    return result.verdict === 'known-now-killed';
  });

  const errors = results.filter((result) => {
    return result.verdict === 'error';
  });

  const sourceless: string[] = sourcelessCases();

  const lines: string[] = [
    '# Отчёт регрессии',
    '',
    `Режим мутаций: ${all ? 'все' : `изменённые относительно ${ref}`}.`,
    '',
    `Порядок тестов перемешан, зерно ${shuffleSeed}; повтор: \`--sequence.shuffle --sequence.seed=${shuffleSeed}\`.`,
    '',
    '## Шаги',
    '',
    ...steps.map((step: StepResult) => {
      const state: string =
        step.skipped ?? (step.exitCode === 0 ? 'зелёный' : `красный (код ${step.exitCode})`);

      return `- ${step.name}: ${state}`;
    }),
    '',
    '## Новые падения',
    '',
    ...renderFailures(failures),
    '## Починенные баги',
    '',
    ...(fixed.length === 0
      ? ['Нет.', '']
      : [
          ...fixed.map((item: Failure) => {
            return `- \`${item.caseId}\` — ${item.file}${item.line === undefined ? '' : `:${item.line}`}: test.fails теперь проходит, снимите пометку`;
          }),
          '',
        ]),
    '## Выжившие мутации',
    '',
    ...(survivors.length === 0
      ? ['Нет.', '']
      : [
          ...survivors.map((item) => {
            return `- \`${item.id}\` — ${item.file} (таблица ${item.table})`;
          }),
          '',
        ]),
    '## Ошибочные приписки мутаций',
    '',
    ...(wrongKills.length === 0
      ? ['Нет.', '']
      : [
          ...wrongKills.map((item) => {
            const failed: string =
              item.failedTestTitles.length === 0
                ? 'ни одна проверка не упала'
                : `упали: ${item.failedTestTitles.join('; ')}`;

            const thrown: string =
              item.loadErrors.length === 0
                ? ''
                : `; файл упал до проверок: ${item.loadErrors.join(', ')}`;

            return `- \`${item.id}\` — убита не той проверкой, не упали заявленные кейсы: ${item.missingCaseIds.join(', ')} (${item.table}); ${failed}${thrown}`;
          }),
          '',
        ]),
    '## Эквивалентные мутации, которые поймали',
    '',
    ...(nowKilled.length === 0
      ? ['Нет.', '']
      : [
          ...nowKilled.map((item) => {
            return `- \`${item.id}\` — ${item.file} (таблица ${item.table}): причина «${item.note}» больше не верна; упали: ${item.failedTestTitles.join('; ')}`;
          }),
          '',
        ]),
    '## Кейсы без источника',
    '',
    ...(sourceless.length === 0
      ? ['Нет.', '']
      : [
          ...sourceless.map((item: string) => {
            return `- ${item}`;
          }),
          '',
        ]),
    '## Итого',
    '',
    `- новых падений: ${failures.length}`,
    `- починенных багов: ${fixed.length}`,
    `- выживших мутаций: ${survivors.length}`,
    `- ошибочных приписок: ${wrongKills.length}`,
    `- эквивалентных, которые поймали: ${nowKilled.length}`,
    `- ошибок запуска мутаций: ${errors.length}`,
    `- кейсов без источника: ${sourceless.length}`,
    '',
  ];

  writeFileSync(REPORT_FILE, lines.join('\n'));
  console.log(`\nОтчёт: ${relative(ROOT, REPORT_FILE)}`);

  const stepFailed: boolean = steps.some((step: StepResult) => {
    return step.exitCode !== 0;
  });

  const bad: boolean =
    stepFailed ||
    failures.length > 0 ||
    survivors.length > 0 ||
    wrongKills.length > 0 ||
    nowKilled.length > 0 ||
    errors.length > 0;

  return bad ? 1 : 0;
};

const main = (): number => {
  const stamp: string = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const mutationsFile: string = join(OUTPUT_DIR, `${stamp}-${process.pid}-mutations.json`);

  const ignore = (): void => {
    return undefined;
  };

  process.on('SIGINT', ignore);
  process.on('SIGTERM', ignore);

  try {
    return execute(mutationsFile);
  } catch (error) {
    if (error instanceof RunAborted) {
      console.error('\nregress stopped');

      return 130;
    }

    throw error;
  }
};

process.exitCode = main();
