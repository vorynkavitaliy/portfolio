import type { WorldShellCaseId } from '@tests/front/ui/world/world-shell.cases';

export type WorldShellMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly WorldShellCaseId[];
}>;

const SHELL = 'src/sections/world/world-shell.client.tsx';
const LOADER = 'src/sections/world/loader.client.tsx';
const CONTROLS = 'src/sections/world/header-controls.client.tsx';
const NOTICE = 'src/sections/world/notice.client.tsx';

export const WORLD_SHELL_MUTATIONS: readonly WorldShellMutation[] = [
  {
    id: 'take-off-next-task',
    file: LOADER,
    find: '    worldStore.update(takeOff);\n',
    replace: '    window.setTimeout(() => {\n      worldStore.update(takeOff);\n    }, 0);\n',
    caseIds: ['shell.take-off.gesture'],
  },
  {
    id: 'watchdog-never-fails',
    file: SHELL,
    find: "      fail('timeout');\n",
    replace: '',
    caseIds: ['shell.watchdog'],
  },
  {
    id: 'stage-chunk-failure-ignored',
    file: SHELL,
    find: "          fail('chunk-failed');\n",
    replace: '',
    nth: 1,
    caseIds: ['shell.chunk-failed'],
  },
  {
    id: 'stage-unmounts-in-text',
    file: SHELL,
    find: "generation !== null && bootStatus !== 'failed'",
    replace: "generation !== null && view === 'world' && bootStatus !== 'failed'",
    caseIds: ['shell.view-switch'],
  },
  {
    id: 'take-off-untracked',
    file: LOADER,
    find: "    track({ name: 'take_off' });\n",
    replace: '',
    caseIds: ['shell.take-off.click'],
  },
  {
    id: 'decision-skipped',
    file: SHELL,
    find: '    decideOnHydration();\n',
    replace: '',
    caseIds: ['shell.world.start', 'shell.notice.no-webgl2', 'shell.low-end'],
  },
  {
    id: 'watchdog-not-cleared',
    file: SHELL,
    find: '      window.clearTimeout(timer);\n',
    replace: '',
    caseIds: ['shell.watchdog.cleared'],
  },
  {
    id: 'worker-failure-ignored',
    file: SHELL,
    find: "        fail('worker-failed');\n",
    replace: '',
    caseIds: ['shell.worker-failed'],
  },
  {
    id: 'engine-not-marked',
    file: SHELL,
    find: '          worldStore.update(setEngineLoaded);\n',
    replace: '',
    caseIds: ['shell.progress'],
  },
  {
    id: 'auto-text-untracked',
    file: SHELL,
    find: "      track({ name: 'text_version_opened', source });\n",
    replace: '',
    caseIds: ['shell.notice.no-webgl2', 'shell.deep-link', 'shell.low-end', 'shell.chunk-failed'],
  },
  {
    id: 'stage-wrong-labels',
    file: SHELL,
    find: 'labels={stationLabels}',
    replace: 'labels={[]}',
    caseIds: ['shell.stage-props'],
  },
  {
    id: 'hud-in-text',
    file: SHELL,
    find: "Hud !== null && view === 'world'",
    replace: 'Hud !== null',
    caseIds: ['shell.hud-world-only'],
  },
  {
    id: 'idle-timeout',
    file: SHELL,
    find: '    }, IDLE_TIMEOUT_MS);\n',
    replace: '    }, 3000);\n',
    caseIds: ['shell.world.start'],
  },
  {
    id: 'take-off-always-enabled',
    file: LOADER,
    find: 'disabled={!status.ready}',
    replace: 'disabled={false}',
    caseIds: ['shell.take-off.disabled'],
  },
  {
    id: 'focus-always',
    file: LOADER,
    find: 'button !== null && focusIsFree()',
    replace: 'button !== null',
    caseIds: ['shell.take-off.focus-kept'],
  },
  {
    id: 'focus-never',
    file: LOADER,
    find: '      button.focus({ preventScroll: true });\n',
    replace: '',
    caseIds: ['shell.take-off.focus'],
  },
  {
    id: 'loader-link-untracked',
    file: LOADER,
    find: "    track({ name: 'text_version_opened', source: 'loader' });\n",
    replace: '',
    caseIds: ['shell.text-link'],
  },
  {
    id: 'cells-floor',
    file: LOADER,
    find: 'Math.round(status.progress * LOADER_CELLS)',
    replace: 'Math.floor(status.progress * LOADER_CELLS)',
    caseIds: ['shell.progress'],
  },
  {
    id: 'toggle-without-world',
    file: CONTROLS,
    find: "state.worldAvailable ? 'text' : 'none'",
    replace: "'text'",
    caseIds: ['shell.controls.unavailable'],
  },
  {
    id: 'controls-before-take-off',
    file: CONTROLS,
    find: "state.view === 'world' && state.boot.status === 'running' ? 'world' : 'none'",
    replace: "state.view === 'world' ? 'world' : 'none'",
    caseIds: ['shell.controls.hidden'],
  },
  {
    id: 'autopilot-controls-wrong',
    file: CONTROLS,
    find: 'aria-controls={AUTOPILOT_MENU_ID}',
    replace: 'aria-controls={ROAD_MAP_ID}',
    caseIds: ['shell.controls.running'],
  },
  {
    id: 'menu-not-toggled',
    file: CONTROLS,
    find: "state.menu === menu ? 'none' : menu",
    replace: 'menu',
    caseIds: ['shell.menu'],
  },
  {
    id: 'sound-label-fixed',
    file: CONTROLS,
    find: '{sound ? copy.soundOn : copy.soundOff}',
    replace: '{copy.soundOff}',
    caseIds: ['shell.sound', 'shell.controls.running'],
  },
  {
    id: 'toggle-untracked',
    file: CONTROLS,
    find: "  track({ name: 'text_version_opened', source: 'toggle' });\n",
    replace: '',
    caseIds: ['shell.view-switch'],
  },
  {
    id: 'notice-failed-missing',
    file: NOTICE,
    find: "  if (reason === 'failed') {\n    return copy.failed;\n  }\n",
    replace: '',
    caseIds: ['shell.notice.failed', 'shell.watchdog', 'shell.chunk-failed'],
  },
  {
    id: 'notice-no-webgl2-missing',
    file: NOTICE,
    find: '    return copy.noWebgl2;\n',
    replace: '    return copy.failed;\n',
    caseIds: ['shell.notice.no-webgl2'],
  },
];
