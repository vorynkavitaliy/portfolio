import type { HudCaseId } from '@tests/front/ui/hud/hud.cases';

export type HudMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly HudCaseId[];
}>;

const KEYS = 'src/sections/world/hud/use-world-keys.ts';
const FOCUS = 'src/sections/world/hud/use-menu-focus.ts';
const MENU = 'src/sections/world/hud/autopilot-menu.client.tsx';
const MAP = 'src/sections/world/hud/road-map.client.tsx';
const BAR = 'src/sections/world/hud/station-bar.client.tsx';
const HINT = 'src/sections/world/hud/flight-hint.client.tsx';
const BOOST = 'src/sections/world/hud/boost-button.client.tsx';
const TITLE = 'src/sections/world/hud/title-card.client.tsx';
const FLASH = 'src/sections/world/hud/flash.client.tsx';
const PANEL = 'src/sections/world/hud/panel-motion.client.tsx';
const MAGNET = 'src/sections/world/hud/magnet.client.tsx';
const ANNOUNCER = 'src/sections/world/hud/dock-announcer.client.tsx';
const SLOW = 'src/sections/world/hud/slow-prompt.client.tsx';
const ROOT = 'src/sections/world/hud/world-hud.client.tsx';
const SHELL = 'src/sections/world/world-shell.client.tsx';
const CONSTANTS = 'src/sections/world/hud/hud.constants.ts';

export const HUD_MUTATIONS: readonly HudMutation[] = [
  {
    id: 'hud-shown-before-running',
    file: ROOT,
    find: "state.view === 'world' && state.boot.status === 'running'",
    replace: "state.view === 'world'",
    caseIds: ['hud.gate.running'],
  },
  {
    id: 'bar-click-does-nothing',
    file: BAR,
    find: '                autopilotTo(id);\n',
    replace: '',
    caseIds: ['hud.bar.click'],
  },
  {
    id: 'bar-current-always',
    file: BAR,
    find: "aria-current={here === id ? 'true' : undefined}",
    replace: "aria-current={here === null ? undefined : 'true'}",
    caseIds: ['hud.bar.current'],
  },
  {
    id: 'bar-counter-counts-total',
    file: BAR,
    find: '{ n: visited.length, total: STATION_IDS.length }',
    replace: '{ n: STATION_IDS.length, total: STATION_IDS.length }',
    caseIds: ['hud.bar.counter'],
  },
  {
    id: 'menu-visited-never-marked',
    file: MENU,
    find: 'const seen: boolean = visited.includes(id);',
    replace: 'const seen: boolean = visited.includes(id) && visited.length < 0;',
    caseIds: ['hud.menu.items'],
  },
  {
    id: 'menu-wrong-role',
    file: MENU,
    find: 'role="menu"',
    replace: 'role="listbox"',
    caseIds: ['hud.menu.items'],
  },
  {
    id: 'menu-no-focus-on-open',
    file: FOCUS,
    find: '    if (open) {\n      focusWithin(root);\n\n      return;\n    }\n',
    replace: '    if (open) {\n      return;\n    }\n',
    caseIds: ['hud.menu.focus-open', 'hud.menu.arrows'],
  },
  {
    id: 'menu-arrow-down-no-wrap',
    file: MENU,
    find: 'ArrowDown: current >= last ? 0 : current + 1,',
    replace: 'ArrowDown: Math.min(last, current + 1),',
    caseIds: ['hud.menu.arrows'],
  },
  {
    id: 'menu-choose-keeps-open',
    file: MENU,
    find: '              autopilotAndClose(id);',
    replace: '              autopilotTo(id);',
    caseIds: ['hud.menu.choose'],
  },
  {
    id: 'menu-focus-not-returned',
    file: FOCUS,
    find: '    returnFocus(root, menu);\n',
    replace: '',
    caseIds: ['hud.menu.escape', 'hud.menu.choose'],
  },
  {
    id: 'escape-ignores-open-menu',
    file: KEYS,
    find: "  if (state.menu !== 'none') {\n    closeMenu();\n\n    return;\n  }\n",
    replace: '',
    caseIds: ['hud.menu.escape', 'hud.menu.escape-order'],
  },
  {
    id: 'escape-closes-menu-and-takes-off',
    file: KEYS,
    find: '    closeMenu();\n\n    return;\n',
    replace: '    closeMenu();\n',
    caseIds: ['hud.menu.escape-order'],
  },
  {
    id: 'map-second-menu-stays-open',
    file: MAP,
    find: "return state.menu === 'map';",
    replace: "return state.menu === 'map' || state.menu === 'autopilot';",
    caseIds: ['hud.menu.single'],
  },
  {
    id: 'map-canvas-wrong-size',
    file: CONSTANTS,
    find: 'export const MAP_SIZE = 128;',
    replace: 'export const MAP_SIZE = 160;',
    caseIds: ['hud.map.canvas'],
  },
  {
    id: 'map-not-pixelated',
    file: MAP,
    find: ' [image-rendering:pixelated]',
    replace: '',
    caseIds: ['hud.map.canvas'],
  },
  {
    id: 'map-refresh-slow',
    file: CONSTANTS,
    find: 'export const MAP_REFRESH_MS = 200;',
    replace: 'export const MAP_REFRESH_MS = 1000;',
    caseIds: ['hud.map.draw'],
  },
  {
    id: 'map-interval-leaks',
    file: MAP,
    find: '      window.clearInterval(timer);\n',
    replace: '',
    caseIds: ['hud.map.draw'],
  },
  {
    id: 'map-click-ignores-miss',
    file: MAP,
    find: 'if (station !== undefined && station !== null) {',
    replace:
      "if (station !== undefined) {\n      autopilotAndClose(station ?? 'home-base');\n    }\n\n    if (station === undefined) {",
    caseIds: ['hud.map.click'],
  },
  {
    id: 'map-click-swaps-axes',
    file: MAP,
    find: 'u: (event.clientX - rect.left) / rect.width,',
    replace: 'u: (event.clientY - rect.top) / rect.height,',
    caseIds: ['hud.map.click'],
  },
  {
    id: 'space-takes-off-when-flying',
    file: KEYS,
    find: 'if (!docked || isEditable(event.target) || event.target instanceof HTMLButtonElement) {',
    replace: 'if (isEditable(event.target) || event.target instanceof HTMLButtonElement) {',
    caseIds: ['hud.keys.space-exceptions'],
  },
  {
    id: 'space-takes-off-from-button',
    file: KEYS,
    find: 'if (!docked || isEditable(event.target) || event.target instanceof HTMLButtonElement) {',
    replace: 'if (!docked || isEditable(event.target)) {',
    caseIds: ['hud.keys.space-exceptions'],
  },
  {
    id: 'space-takes-off-from-field',
    file: KEYS,
    find: 'if (!docked || isEditable(event.target) || event.target instanceof HTMLButtonElement) {',
    replace: 'if (!docked || event.target instanceof HTMLButtonElement) {',
    caseIds: ['hud.keys.space-exceptions'],
  },
  {
    id: 'space-scrolls-page',
    file: KEYS,
    find: '    event.preventDefault();\n',
    replace: '',
    caseIds: ['hud.keys.space'],
  },
  {
    id: 'escape-takes-off-when-flying',
    file: KEYS,
    find: "  if (docked) {\n    worldStore.dispatch({ type: 'take-off' });\n  }\n",
    replace: "  worldStore.dispatch({ type: 'take-off' });\n",
    caseIds: ['hud.keys.esc-take-off'],
  },
  {
    id: 'any-key-undocks',
    file: KEYS,
    find: "  if (event.key !== 'Escape') {\n    return;\n  }\n",
    replace:
      "  if (event.key !== 'Escape' && docked) {\n    worldStore.dispatch({ type: 'take-off' });\n\n    return;\n  }\n\n  if (event.key !== 'Escape') {\n    return;\n  }\n",
    caseIds: ['hud.keys.other-keys'],
  },
  {
    id: 'hint-touch-text-ignored',
    file: HINT,
    find: 'const coarse: boolean = useCoarsePointer();',
    replace: 'const coarse: boolean = useCoarsePointer() && false;',
    caseIds: ['hud.hint.touch'],
  },
  {
    id: 'hint-stays-after-input',
    file: HINT,
    find: 'const visible: boolean = docked || !inputUsed;',
    replace: 'const visible: boolean = true;',
    caseIds: ['hud.hint.hidden-after-input'],
  },
  {
    id: 'hint-docked-hidden-after-input',
    file: HINT,
    find: 'const visible: boolean = docked || !inputUsed;',
    replace: 'const visible: boolean = !inputUsed;',
    caseIds: ['hud.hint.docked'],
  },
  {
    id: 'hint-docked-text-missing',
    file: HINT,
    find: 'const text: string = docked',
    replace: 'const text: string = docked && false',
    caseIds: ['hud.hint.docked'],
  },
  {
    id: 'boost-never-released',
    file: BOOST,
    find: '      onPointerUp={release}\n',
    replace: '',
    caseIds: ['hud.boost.hold'],
  },
  {
    id: 'boost-stuck-on-dock',
    file: BOOST,
    find: '    if (!flying) {\n      return;\n    }\n\n    return release;',
    replace: '    return;',
    caseIds: ['hud.boost.release-on-dock'],
  },
  {
    id: 'boost-shown-on-fine-pointers',
    file: BOOST,
    find: ' hidden ',
    replace: ' inline-flex ',
    caseIds: ['hud.boost.touch-only'],
  },
  {
    id: 'announcer-assertive',
    file: ANNOUNCER,
    find: 'aria-live="polite"',
    replace: 'aria-live="assertive"',
    caseIds: ['hud.announcer'],
  },
  {
    id: 'title-card-never-plays',
    file: TITLE,
    find: '      playTitleCard({ card, tag, title, line });\n',
    replace: '',
    caseIds: ['hud.title.dock'],
  },
  {
    id: 'title-card-plays-while-flying',
    file: TITLE,
    find: 'if (docked === null || card === null',
    replace: 'if (card === null',
    caseIds: ['hud.title.dock'],
  },
  {
    id: 'title-card-unhidden-under-reduced-motion',
    file: TITLE,
    find: '      playTitleCard({ card, tag, title, line });\n',
    replace: '      card.hidden = false;\n      playTitleCard({ card, tag, title, line });\n',
    caseIds: ['hud.title.reduced'],
  },
  {
    id: 'flash-ignores-reduced-motion',
    file: FLASH,
    find: ' || prefersReducedMotion()',
    replace: '',
    caseIds: ['hud.flash.reduced'],
  },
  {
    id: 'flash-take-off-wrong-strength',
    file: CONSTANTS,
    find: "'take-off': { strength: 0.6, durationMs: 900 },",
    replace: "'take-off': { strength: 0.85, durationMs: 900 },",
    caseIds: ['hud.flash.take-off'],
  },
  {
    id: 'flash-send-wrong-duration',
    file: CONSTANTS,
    find: 'send: { strength: 0.5, durationMs: 700 },',
    replace: 'send: { strength: 0.5, durationMs: 520 },',
    caseIds: ['hud.flash.send'],
  },
  {
    id: 'panel-motion-never-plays',
    file: PANEL,
    find: '        playPanelEntrance(panel);\n',
    replace: '',
    caseIds: ['hud.panel-motion'],
  },
  {
    id: 'panel-motion-once',
    file: PANEL,
    find: '{ dependencies: [docked], revertOnUpdate: true }',
    replace: '{ dependencies: [], revertOnUpdate: true }',
    caseIds: ['hud.panel-motion'],
  },
  {
    id: 'magnet-never-attached',
    file: MAGNET,
    find: '].map(attachMagnet);',
    replace: '].map(() => {\n      return () => undefined;\n    });',
    caseIds: ['hud.magnet'],
  },
  {
    id: 'magnet-never-detached',
    file: MAGNET,
    find: '      for (const detach of detachers) {\n        detach();\n      }\n',
    replace: '',
    caseIds: ['hud.magnet'],
  },
  {
    id: 'slow-prompt-always-shown',
    file: SLOW,
    find: 'if (!slow || dismissed) {',
    replace: 'if (dismissed) {',
    caseIds: ['hud.slow'],
  },
  {
    id: 'slow-dismiss-does-nothing',
    file: SLOW,
    find: '            setDismissed(true);\n',
    replace: '',
    caseIds: ['hud.slow'],
  },
  {
    id: 'shell-loads-gsap-in-first-load',
    file: SHELL,
    find: "import { track } from '@/core/analytics/analytics';\n",
    replace:
      "import { track } from '@/core/analytics/analytics';\nimport { gsap } from '@/motion/gsap.client';\n",
    caseIds: ['hud.lazy.gsap'],
  },
];
