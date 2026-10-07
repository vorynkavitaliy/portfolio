import type { BootCaseId } from '@tests/back/sections/world/boot.cases';

export type BootMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly BootCaseId[];
}>;

const FILE = 'src/sections/world/boot.ts';

export const BOOT_MUTATIONS: readonly BootMutation[] = [
  {
    id: 'no-webgl2-ignored',
    file: FILE,
    find: '  if (!probe.webgl2) {\n',
    replace: '  if (false) {\n',
    caseIds: ['boot.view.no-webgl2', 'boot.view.no-webgl2-before-low-end'],
  },
  {
    id: 'memory-boundary',
    file: FILE,
    find: 'probe.deviceMemory < LOW_END_MEMORY_GB',
    replace: 'probe.deviceMemory <= LOW_END_MEMORY_GB',
    caseIds: ['boot.view.memory'],
  },
  {
    id: 'cores-boundary',
    file: FILE,
    find: 'probe.hardwareConcurrency <= LOW_END_MAX_CORES',
    replace: 'probe.hardwareConcurrency < LOW_END_MAX_CORES',
    caseIds: ['boot.view.cores'],
  },
  {
    id: 'escape-boundary',
    file: FILE,
    find: 'probe.sinceNavigationMs >= LOADER_ESCAPE_MS',
    replace: 'probe.sinceNavigationMs > LOADER_ESCAPE_MS',
    caseIds: ['boot.view.escape'],
  },
  {
    id: 'apply-not-once',
    file: FILE,
    find: "  if (state.view !== 'boot') {\n    return state;\n  }\n",
    replace: '',
    caseIds: ['boot.apply.once'],
  },
  {
    id: 'no-webgl2-not-failed',
    file: FILE,
    find: "    return failWorld(state, 'no-webgl2');\n",
    replace: "    return openText(state, 'no-webgl2');\n",
    caseIds: ['boot.apply.no-webgl2'],
  },
  {
    id: 'save-data-ignored',
    file: FILE,
    find: 'probe.saveData === true',
    replace: 'probe.saveData === null',
    caseIds: ['boot.view.save-data', 'boot.view.unreported'],
  },
  {
    id: 'deep-link-ignored',
    file: FILE,
    find: 'probe.hash === TEXT_HASH',
    replace: "probe.hash === '#nope'",
    caseIds: ['boot.view.deep-link'],
  },
  {
    id: 'deep-link-world-always',
    file: FILE,
    find: "reason: 'deep-link', worldAvailable: probe.webgl2",
    replace: "reason: 'deep-link', worldAvailable: true",
    caseIds: ['boot.view.deep-link'],
  },
  {
    id: 'context-not-released',
    file: FILE,
    find: "    context.getExtension('WEBGL_lose_context')?.loseContext();\n",
    replace: '',
    caseIds: ['boot.probe.webgl2'],
  },
  {
    id: 'probe-null-true',
    file: FILE,
    find: '    if (context === null) {\n      return false;\n',
    replace: '    if (context === null) {\n      return true;\n',
    caseIds: ['boot.probe.missing'],
  },
  {
    id: 'probe-throw-true',
    file: FILE,
    find: '  } catch {\n    return false;\n  }\n',
    replace: '  } catch {\n    return true;\n  }\n',
    caseIds: ['boot.probe.throws'],
  },
  {
    id: 'zero-reported',
    file: FILE,
    find: 'Number.isFinite(value) && value > 0',
    replace: 'Number.isFinite(value) && value >= 0',
    caseIds: ['boot.read.navigator'],
  },
  {
    id: 'worker-weight',
    file: FILE,
    find: 'worker: 0.6, engine: 0.25',
    replace: 'worker: 0.5, engine: 0.25',
    caseIds: ['boot.loader.worker', 'boot.loader.engine'],
  },
  {
    id: 'engine-weight',
    file: FILE,
    find: 'engine: 0.25, built',
    replace: 'engine: 0.3, built',
    caseIds: ['boot.loader.building', 'boot.loader.engine-first'],
  },
  {
    id: 'stage-order',
    file: FILE,
    find: "boot.worker < 1 ? 'generating'",
    replace: "!boot.engine ? 'generating'",
    caseIds: ['boot.loader.engine', 'boot.loader.engine-first'],
  },
  {
    id: 'running-not-ready',
    file: FILE,
    find: "boot.status === 'ready' || boot.status === 'running'",
    replace: "boot.status === 'ready'",
    caseIds: ['boot.loader.ready'],
  },
  {
    id: 'escape-constant',
    file: FILE,
    find: 'LOADER_ESCAPE_MS = 12_000',
    replace: 'LOADER_ESCAPE_MS = 10_000',
    caseIds: ['boot.constants'],
  },
  {
    id: 'visitor-tracked',
    file: FILE,
    find: "    case 'visitor':\n      return null;\n",
    replace: "    case 'visitor':\n      return 'toggle';\n",
    caseIds: ['boot.text-source'],
  },
  {
    id: 'escape-source',
    file: FILE,
    find: "    case 'escape':\n",
    replace: "    case 'escape':\n      return 'loader';\n",
    caseIds: ['boot.text-source'],
  },
];
