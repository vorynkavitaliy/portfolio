import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { z } from 'zod';

type Project = 'ui' | 'server';

type Verdict =
  'killed' | 'survived' | 'wrong-kill' | 'known-survivor' | 'known-now-killed' | 'error';

type MutationInput = {
  id: string;
  file: string;
  find: string;
  replace: string;
  caseIds: readonly string[];
  nth: number | undefined;
  expectedSurvivor: string | undefined;
};

type PlannedMutation = MutationInput & {
  table: string;
  project: Project;
  testDir: string;
};

type MutationResult = {
  id: string;
  table: string;
  file: string;
  verdict: Verdict;
  claimedCaseIds: readonly string[];
  failedCaseIds: readonly string[];
  missingCaseIds: readonly string[];
  failedTests: number;
  failedTestTitles: readonly string[];
  unclaimedFailedTitles: readonly string[];
  loadErrors: readonly string[];
  note: string;
  seconds: number;
};

type VitestOutcome = {
  titles: string[];
  located: string[];
  loadErrors: string[];
};

const ROOT: string = process.cwd();
const OUTPUT_DIR: string = resolve(ROOT, '.regression');
const LATEST_FILE: string = resolve(OUTPUT_DIR, 'mutations.latest.json');
const MUTATE_DIR: string = resolve(OUTPUT_DIR, 'mutate');
const BACKUP_DIR: string = resolve(MUTATE_DIR, 'backup');
const JOURNAL_FILE: string = resolve(MUTATE_DIR, 'journal.json');
const MUTATION_TABLE = /\.mutations\.ts$/;

const mutationShape = z.object({
  id: z.string(),
  file: z.string(),
  find: z.string(),
  replace: z.string(),
  caseIds: z.array(z.string()).optional(),
  nth: z.number().int().positive().optional(),
  survivor: z.string().optional(),
  reason: z.string().optional(),
});

const journalShape = z.object({
  entries: z.array(z.object({ file: z.string(), backup: z.string() })),
});

const vitestReport = z.object({
  testResults: z.array(
    z.object({
      name: z.string(),
      status: z.string(),
      message: z.string().optional(),
      assertionResults: z.array(
        z.object({
          title: z.string(),
          status: z.string(),
        }),
      ),
    }),
  ),
});

const readFlag = (args: readonly string[], name: string): string | undefined => {
  const index: number = args.indexOf(name);

  return index === -1 ? undefined : args[index + 1];
};

const git = (...args: string[]): { status: number; stdout: string } => {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });

  return { status: result.status ?? 1, stdout: result.stdout };
};

const walk = (dir: string, acc: string[]): string[] => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path: string = join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(path, acc);

      continue;
    }

    if (MUTATION_TABLE.test(entry.name)) {
      acc.push(relative(ROOT, path));
    }
  }

  return acc;
};

const projectOf = (table: string): Project => {
  return table.startsWith('tests/back/') ? 'server' : 'ui';
};

const changedFiles = (ref: string): Set<string> => {
  const committed = git('diff', '--name-only', `${ref}...HEAD`);

  if (committed.status !== 0) {
    throw new Error(`git diff against "${ref}" failed; fetch the ref first`);
  }

  const working = git('diff', '--name-only', 'HEAD');

  return new Set(
    [...committed.stdout.split('\n'), ...working.stdout.split('\n')].filter((line: string) => {
      return line !== '';
    }),
  );
};

const loadTable = async (
  table: string,
): Promise<{ main: MutationInput[]; equivalent: MutationInput[] }> => {
  const exported: Record<string, unknown> = await import(pathToFileURL(resolve(ROOT, table)).href);
  const main: MutationInput[] = [];
  const equivalent: MutationInput[] = [];

  for (const [name, value] of Object.entries(exported)) {
    if (!Array.isArray(value) || !name.endsWith('_MUTATIONS')) {
      continue;
    }

    const isEquivalentList: boolean = name.startsWith('EQUIVALENT');

    for (const raw of value) {
      const parsed = mutationShape.parse(raw);

      const input: MutationInput = {
        id: parsed.id,
        file: parsed.file,
        find: parsed.find,
        replace: parsed.replace,
        caseIds: parsed.caseIds ?? [],
        nth: parsed.nth,
        expectedSurvivor:
          parsed.survivor ?? (isEquivalentList ? (parsed.reason ?? 'equivalent') : undefined),
      };

      (isEquivalentList ? equivalent : main).push(input);
    }
  }

  return { main, equivalent };
};

const applyMutation = (source: string, mutation: MutationInput): string => {
  const positions: number[] = [];
  let from = 0;

  while (mutation.find.length > 0) {
    const at: number = source.indexOf(mutation.find, from);

    if (at === -1) {
      break;
    }

    positions.push(at);
    from = at + 1;
  }

  const wanted: number = mutation.nth ?? 1;

  if (mutation.nth === undefined && positions.length !== 1) {
    throw new Error(
      `${mutation.id}: "find" must occur exactly once in ${mutation.file}, found ${positions.length}`,
    );
  }

  const position: number | undefined = positions[wanted - 1];

  if (position === undefined) {
    throw new Error(
      `${mutation.id}: occurrence ${wanted} of "find" not found in ${mutation.file} (${positions.length} found)`,
    );
  }

  return (
    source.slice(0, position) + mutation.replace + source.slice(position + mutation.find.length)
  );
};

const children = new Set<ChildProcess>();

let stopping = false;

const runVitest = (project: Project, testDir: string, reportFile: string): Promise<void> => {
  return new Promise<void>((done) => {
    const child = spawn(
      'npx',
      [
        'vitest',
        'run',
        '--project',
        project,
        `${testDir}/`,
        '--reporter=json',
        `--outputFile=${reportFile}`,
      ],
      { cwd: ROOT, stdio: 'ignore', detached: true },
    );

    children.add(child);

    child.on('close', () => {
      children.delete(child);
      done();
    });

    child.on('error', () => {
      children.delete(child);
      done();
    });
  });
};

const killChildren = (): void => {
  for (const child of children) {
    if (child.pid === undefined) {
      continue;
    }

    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      child.kill('SIGKILL');
    }
  }
};

const readOutcome = (reportFile: string): VitestOutcome | undefined => {
  if (!existsSync(reportFile)) {
    return undefined;
  }

  let raw: unknown;

  try {
    raw = JSON.parse(readFileSync(reportFile, 'utf8'));
  } catch {
    return undefined;
  }

  const parsed = vitestReport.safeParse(raw);

  if (!parsed.success) {
    return undefined;
  }

  const titles: string[] = [];
  const located: string[] = [];
  const loadErrors: string[] = [];

  for (const file of parsed.data.testResults) {
    const name: string = relative(ROOT, file.name);

    if (file.status === 'failed' && file.assertionResults.length === 0) {
      loadErrors.push(name);
    }

    for (const assertion of file.assertionResults) {
      if (assertion.status === 'failed') {
        titles.push(assertion.title);
        located.push(`${name} > ${assertion.title}`);
      }
    }
  }

  return { titles, located, loadErrors };
};

const caseFailed = (caseId: string, titles: readonly string[]): boolean => {
  return titles.some((title: string) => {
    return title.startsWith(`${caseId}: `);
  });
};

const claimedAndFailed = (
  mutation: PlannedMutation,
  titles: readonly string[],
): { failed: string[]; missing: string[] } => {
  const failed: string[] = [];
  const missing: string[] = [];

  for (const caseId of mutation.caseIds) {
    (caseFailed(caseId, titles) ? failed : missing).push(caseId);
  }

  return { failed, missing };
};

const backups = new Map<string, string>();

const restore = (file: string): void => {
  const backup: string | undefined = backups.get(file);

  if (backup === undefined) {
    return;
  }

  copyFileSync(backup, resolve(ROOT, file));
};

const backUp = (files: readonly string[]): void => {
  for (const file of files) {
    backups.delete(file);
  }

  rmSync(BACKUP_DIR, { recursive: true, force: true });
  mkdirSync(BACKUP_DIR, { recursive: true });

  for (const [index, file] of files.entries()) {
    const target: string = join(BACKUP_DIR, `${index}-${file.replaceAll('/', '_')}`);

    copyFileSync(resolve(ROOT, file), target);
    backups.set(file, target);
  }

  const entries = [...backups.entries()].map(([file, backup]: [string, string]) => {
    return { file, backup };
  });

  writeFileSync(JOURNAL_FILE, JSON.stringify({ entries }, null, 2));
};

const recoverFromJournal = (): 'none' | 'restored' | 'failed' => {
  if (!existsSync(JOURNAL_FILE)) {
    return 'none';
  }

  let outcome: 'restored' | 'failed' = 'restored';

  try {
    const { entries } = journalShape.parse(JSON.parse(readFileSync(JOURNAL_FILE, 'utf8')));

    for (const { file, backup } of entries) {
      copyFileSync(backup, resolve(ROOT, file));

      if (readFileSync(backup, 'utf8') !== readFileSync(resolve(ROOT, file), 'utf8')) {
        outcome = 'failed';
      }
    }
  } catch {
    outcome = 'failed';
  }

  if (outcome === 'restored') {
    rmSync(MUTATE_DIR, { recursive: true, force: true });
  }

  return outcome;
};

const unclaimed = (mutation: PlannedMutation, located: readonly string[]): string[] => {
  return located.filter((entry: string) => {
    return !mutation.caseIds.some((caseId: string) => {
      return caseFailed(caseId, [entry.slice(entry.indexOf(' > ') + 3)]);
    });
  });
};

const hasHead = (): boolean => {
  return git('rev-parse', '--verify', 'HEAD').status === 0;
};

const isDirty = (file: string): boolean => {
  return hasHead() && git('status', '--porcelain', '--', file).stdout.trim() !== '';
};

const differsFromBackup = (file: string): boolean => {
  const backup: string | undefined = backups.get(file);

  if (backup === undefined) {
    return false;
  }

  try {
    return readFileSync(backup, 'utf8') !== readFileSync(resolve(ROOT, file), 'utf8');
  } catch {
    return true;
  }
};

const runMutation = async (mutation: PlannedMutation, scratch: string): Promise<MutationResult> => {
  const started: number = Date.now();
  const absolute: string = resolve(ROOT, mutation.file);

  const reportFile: string = join(
    scratch,
    `${mutation.table.replaceAll('/', '_')}.${mutation.id}.json`,
  );

  const base = {
    id: mutation.id,
    table: mutation.table,
    file: mutation.file,
    claimedCaseIds: mutation.caseIds,
  };

  const empty = {
    failedCaseIds: [],
    missingCaseIds: [],
    failedTests: 0,
    failedTestTitles: [],
    unclaimedFailedTitles: [],
    loadErrors: [],
  };

  try {
    if (stopping) {
      throw new Error('stopped');
    }

    writeFileSync(absolute, applyMutation(readFileSync(absolute, 'utf8'), mutation));
    await runVitest(mutation.project, mutation.testDir, reportFile);
  } catch (error) {
    restore(mutation.file);

    return {
      ...base,
      ...empty,
      verdict: 'error',
      note: error instanceof Error ? error.message : 'unknown error',
      seconds: (Date.now() - started) / 1000,
    };
  } finally {
    restore(mutation.file);
  }

  const outcome = readOutcome(reportFile);
  const seconds: number = (Date.now() - started) / 1000;

  if (outcome === undefined) {
    return { ...base, ...empty, verdict: 'error', note: 'vitest produced no report', seconds };
  }

  const failedTests: number = outcome.titles.length;
  const { failed, missing } = claimedAndFailed(mutation, outcome.titles);
  const survived: boolean = failedTests === 0 && outcome.loadErrors.length === 0;

  const details = {
    failedCaseIds: failed,
    missingCaseIds: missing,
    failedTests,
    failedTestTitles: outcome.located,
    unclaimedFailedTitles: unclaimed(mutation, outcome.located),
    loadErrors: outcome.loadErrors,
  };

  if (mutation.expectedSurvivor !== undefined) {
    return {
      ...base,
      ...details,
      verdict: survived ? 'known-survivor' : 'known-now-killed',
      note: mutation.expectedSurvivor,
      seconds,
    };
  }

  if (survived) {
    return {
      ...base,
      ...details,
      verdict: 'survived',
      missingCaseIds: [...mutation.caseIds],
      note: '',
      seconds,
    };
  }

  const verdict: Verdict =
    missing.length === 0 && mutation.caseIds.length > 0 ? 'killed' : 'wrong-kill';

  const note: string =
    failedTests === 0
      ? 'no test failed, a test file threw before its tests ran'
      : outcome.loadErrors.length > 0
        ? 'a test file threw before its tests ran'
        : '';

  return { ...base, ...details, verdict, note, seconds };
};

const pool = async (
  planned: readonly PlannedMutation[],
  concurrency: number,
  scratch: string,
): Promise<MutationResult[]> => {
  const results: MutationResult[] = [];
  const queue: PlannedMutation[] = [...planned];
  const busyFiles = new Set<string>();
  const busyProjects = new Set<Project>();
  const running = new Set<Promise<void>>();

  const takeNext = (): PlannedMutation | undefined => {
    const index: number = queue.findIndex((item: PlannedMutation) => {
      const projectFree: boolean = item.project === 'ui' || !busyProjects.has('server');

      return !busyFiles.has(item.file) && projectFree;
    });

    return index === -1 ? undefined : queue.splice(index, 1)[0];
  };

  while ((queue.length > 0 && !stopping) || running.size > 0) {
    const canStart: boolean = running.size < concurrency && !stopping;
    const next: PlannedMutation | undefined = canStart ? takeNext() : undefined;

    if (next === undefined) {
      await Promise.race(running);

      continue;
    }

    busyFiles.add(next.file);
    busyProjects.add(next.project);

    const task: Promise<void> = runMutation(next, scratch).then((result: MutationResult) => {
      results.push(result);
      busyFiles.delete(next.file);
      busyProjects.delete(next.project);
      running.delete(task);

      const detail: string =
        result.missingCaseIds.length > 0 ? ` missing=[${result.missingCaseIds.join(', ')}]` : '';

      console.log(
        `${result.verdict.padEnd(16)} ${next.table.split('/').pop() ?? ''} ${result.id} failedTests=${result.failedTests}${detail}`,
      );

      const flagged: boolean =
        result.verdict === 'wrong-kill' ||
        result.verdict === 'known-now-killed' ||
        result.verdict === 'survived';

      if (flagged) {
        const header: string =
          result.verdict === 'wrong-kill'
            ? `  KILLED BY THE WRONG TEST (claimed: ${result.claimedCaseIds.join(', ') || 'none'}) ${result.note}`
            : `  ${result.verdict.toUpperCase()} ${result.note}`;

        console.log(header.trimEnd());

        for (const title of result.failedTestTitles) {
          console.log(`    failed: ${title}`);
        }

        for (const file of result.loadErrors) {
          console.log(`    threw before tests ran: ${file}`);
        }
      }
    });

    running.add(task);
  }

  return results;
};

const summarise = (results: readonly MutationResult[]): Record<Verdict, number> => {
  const totals: Record<Verdict, number> = {
    killed: 0,
    survived: 0,
    'wrong-kill': 0,
    'known-survivor': 0,
    'known-now-killed': 0,
    error: 0,
  };

  for (const result of results) {
    totals[result.verdict] += 1;
  }

  return totals;
};

const LOCK_DIR: string = resolve(OUTPUT_DIR, 'mutate.lock.d');
const LOCK_PID_FILE: string = join(LOCK_DIR, 'pid');
const LOCK_GRACE_MS = 10_000;

const holderAlive = (dir: string = LOCK_DIR): boolean => {
  let pid: number;

  try {
    pid = Number(readFileSync(join(dir, 'pid'), 'utf8'));
  } catch {
    try {
      return Date.now() - statSync(dir).mtimeMs < LOCK_GRACE_MS;
    } catch {
      return false;
    }
  }

  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);

    return true;
  } catch (error) {
    return !(error instanceof Error && 'code' in error && error.code === 'ESRCH');
  }
};

const acquireLock = async (): Promise<boolean> => {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  let announced = false;

  while (!stopping) {
    try {
      mkdirSync(LOCK_DIR);
      writeFileSync(LOCK_PID_FILE, String(process.pid));

      return true;
    } catch {
      if (!holderAlive()) {
        const stale = `${LOCK_DIR}.stale.${process.pid}`;

        try {
          renameSync(LOCK_DIR, stale);

          if (holderAlive(stale)) {
            renameSync(stale, LOCK_DIR);
          } else {
            rmSync(stale, { recursive: true, force: true });
          }
        } catch {
          continue;
        }

        continue;
      }

      if (!announced) {
        console.log('another mutation run edits this working tree; waiting for it to finish');
        announced = true;
      }

      await new Promise<void>((done) => {
        setTimeout(done, 500);
      });
    }
  }

  return false;
};

const releaseLock = (): void => {
  rmSync(LOCK_DIR, { recursive: true, force: true });
};

const defaultOutput = (): string => {
  const stamp: string = new Date().toISOString().replace(/\D/g, '').slice(0, 14);

  return join('.regression', `${stamp}-${process.pid}-mutations.json`);
};

const main = async (): Promise<number> => {
  const args: string[] = process.argv.slice(2);
  const changedRef: string | undefined = readFlag(args, '--changed');
  const limitRaw: string | undefined = readFlag(args, '--limit');
  const concurrency: number = Math.max(1, Number(readFlag(args, '--concurrency') ?? '1'));
  const limit: number = limitRaw === undefined ? Number.POSITIVE_INFINITY : Number(limitRaw);
  const allowDirty: boolean = args.includes('--allow-dirty');
  const valueFlags = new Set<string>(['--changed', '--limit', '--concurrency', '--output']);

  const explicit: string[] = args.filter((arg: string, index: number) => {
    return !arg.startsWith('--') && !valueFlags.has(args[index - 1] ?? '');
  });

  const tables: string[] =
    explicit.length > 0
      ? explicit.map((table: string) => {
          return relative(ROOT, resolve(ROOT, table));
        })
      : walk(resolve(ROOT, 'tests'), []).sort();

  const changed: Set<string> | undefined =
    changedRef === undefined || !hasHead() ? undefined : changedFiles(changedRef);

  const planned: PlannedMutation[] = [];

  for (const table of tables) {
    const { main: mainList, equivalent } = await loadTable(table);
    const testDir: string = dirname(table);

    const tableTouched: boolean =
      changed === undefined ||
      [...changed].some((path: string) => {
        return path.startsWith(`${testDir}/`);
      });

    for (const mutation of [...mainList, ...equivalent]) {
      const selected: boolean = changed === undefined || tableTouched || changed.has(mutation.file);

      if (selected) {
        planned.push({ ...mutation, table, project: projectOf(table), testDir });
      }
    }
  }

  const limited: PlannedMutation[] = planned.slice(0, limit);

  const skipped: string[] = planned.slice(limited.length).map((mutation: PlannedMutation) => {
    return `${mutation.expectedSurvivor === undefined ? '' : 'equivalent:'}${mutation.id}`;
  });

  const targets: string[] = [
    ...new Set(
      limited.map((mutation: PlannedMutation) => {
        return mutation.file;
      }),
    ),
  ];

  const stop = (): void => {
    stopping = true;
    killChildren();
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  process.on('SIGHUP', stop);

  if (!(await acquireLock())) {
    return 130;
  }

  const recovered = recoverFromJournal();

  if (recovered !== 'none') {
    releaseLock();

    console.error(
      recovered === 'restored'
        ? 'a previous mutation run did not finish; its backups were restored from the journal. Check the working tree and run again.'
        : `a previous mutation run did not finish and restore failed; backups and journal are kept in ${relative(ROOT, MUTATE_DIR)}`,
    );

    return 3;
  }

  const scratch: string = mkdtempSync(join(tmpdir(), 'portfolio-mutate-'));
  let results: MutationResult[] = [];
  let refused = false;
  let started = false;
  let restoreFailed = false;

  try {
    const dirtyTargets: string[] = targets.filter(isDirty);

    if (dirtyTargets.length > 0 && !allowDirty) {
      refused = true;

      console.error(
        `Refusing to start: uncommitted changes in ${dirtyTargets.join(', ')} (commit them or pass --allow-dirty to rely on the file backup)`,
      );
    } else {
      backUp(targets);
      started = true;

      results = await pool(limited, concurrency, scratch);
    }
  } finally {
    killChildren();

    if (started) {
      for (const file of targets) {
        try {
          restore(file);
        } catch {
          restoreFailed = true;
        }
      }

      restoreFailed = restoreFailed || targets.some(differsFromBackup);

      if (restoreFailed) {
        console.error(
          `restore failed; backups and journal are kept in ${relative(ROOT, MUTATE_DIR)}`,
        );
      } else {
        rmSync(MUTATE_DIR, { recursive: true, force: true });
      }
    }

    rmSync(scratch, { recursive: true, force: true });
    releaseLock();
  }

  if (refused) {
    return 2;
  }

  if (restoreFailed) {
    console.error('a mutated file differs from its backup after restore; check the working tree');
  }

  if (stopping) {
    console.error(restoreFailed ? 'mutation run stopped' : 'mutation run stopped; files restored');

    return 130;
  }

  const totals: Record<Verdict, number> = summarise(results);
  const outputFile: string = resolve(ROOT, readFlag(args, '--output') ?? defaultOutput());
  const payload: string = JSON.stringify({ totals, skipped, results }, null, 2);

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, payload);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(`${LATEST_FILE}.${process.pid}.tmp`, payload);
  renameSync(`${LATEST_FILE}.${process.pid}.tmp`, LATEST_FILE);

  console.log('\nverdict            count');

  for (const [verdict, count] of Object.entries(totals)) {
    console.log(`${verdict.padEnd(18)} ${count}`);
  }

  if (skipped.length > 0) {
    console.log(`\nNOT RUN because of --limit (${skipped.length}): ${skipped.join(', ')}`);
  }

  console.log(`\nwritten ${relative(ROOT, outputFile)} and ${relative(ROOT, LATEST_FILE)}`);

  const bad: number =
    totals.survived + totals['wrong-kill'] + totals.error + totals['known-now-killed'];

  return bad > 0 || restoreFailed ? 1 : 0;
};

process.exitCode = await main();
