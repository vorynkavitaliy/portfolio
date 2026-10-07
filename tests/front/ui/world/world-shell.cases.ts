export type WorldShellCaseSource = 'spec' | 'owner-2026-10-07' | 'prototype' | 'apg';

export type WorldShellCase = Readonly<{
  id: string;
  source: WorldShellCaseSource;
  reference: string;
  expected: string;
}>;

const FLOW = 'plan 0002 §4.2 (flow: hydration decides the view; world view starts three loads)';

const FAILURES =
  'spec FR-004, SC-002 (text version within 1 s of a failure, one-line notice, no endless loader); plan 0002 §4.2 step 8';

const VIEWS = 'plan 0002 §4.3 view-state table (header world buttons per state)';

export const WORLD_SHELL_CASES = [
  {
    id: 'shell.ssr.boot',
    source: 'spec',
    reference:
      'FR-001 (server HTML has the loader name, role line and the text version); plan 0002 §4.2 step 1, S21 review focus (first render is boot)',
    expected:
      'server render: data-view boot, data-boot idle, main#text with the children, loader name and line, «Generating world 0%», disabled «Take off», link #text, brand #home-base, no world buttons',
  },
  {
    id: 'shell.world.start',
    source: 'owner-2026-10-07',
    reference: `${FLOW}; rules/nextjs.md §3 (requestIdleCallback, timeout 1500 ms)`,
    expected:
      'capable device → data-view world, loader shown, requestIdleCallback with timeout 1500, generation started once with the sky name, stage chunk requested once',
  },
  {
    id: 'shell.progress',
    source: 'prototype',
    reference:
      'docs/prototype/index.html:749–755 (16 cells, round(p·16) lit, «<label> <percent>%»); plan 0002 §9 S21 weights',
    expected:
      'worker 0.5 → «Generating world 30%», 5 cells lit; worker 1 + engine loaded → «Building scene 85%», 14 cells lit',
  },
  {
    id: 'shell.take-off.disabled',
    source: 'spec',
    reference: 'FR-003 («Take off» is disabled until the world is ready)',
    expected:
      '«Take off» disabled while loading; enabled after the runtime marks ready; «World ready 100%»',
  },
  {
    id: 'shell.take-off.focus',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §9 S21 (Take off focuses the button only when focus is on body)',
    expected: 'focus on body when ready → «Take off» focused',
  },
  {
    id: 'shell.take-off.focus-kept',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §9 S21 (Take off focuses the button only when focus is on body)',
    expected: 'focus on the text link when ready → focus stays on the link',
  },
  {
    id: 'shell.take-off.click',
    source: 'spec',
    reference:
      'FR-037 («Take off» turns sound on), FR-054 (take_off event once); plan 0002 §4.2 step 5',
    expected:
      'click → data-boot running, sound on, one take_off event, loader no longer displayed, world buttons shown',
  },
  {
    id: 'shell.take-off.gesture',
    source: 'owner-2026-10-07',
    reference:
      'plan 0002 D-15 (sound starts inside the click: synchronous store listener creates the AudioContext)',
    expected:
      'a store listener sees sound on and boot running during the click event dispatch, before it ends',
  },
  {
    id: 'shell.text-link',
    source: 'spec',
    reference:
      'FR-003 («Read the text version» available at any time), FR-054 (text version opened, source loader)',
    expected:
      'loader link while loading → view text, one text_version_opened {source loader}, loader not displayed, main visible',
  },
  {
    id: 'shell.controls.hidden',
    source: 'owner-2026-10-07',
    reference: VIEWS,
    expected:
      'world view before Take off (loading and ready): no header buttons, only the brand link',
  },
  {
    id: 'shell.controls.text',
    source: 'spec',
    reference:
      'FR-005, FR-006 («3D world» in text view), FR-045 (brand and view toggle among the first focusables); plan 0002 §9 S21 (toggle label = target view, no aria-pressed)',
    expected:
      'text view with world available: one button «3D world» without aria-pressed; Tab from body reaches the brand, then the toggle',
  },
  {
    id: 'shell.controls.unavailable',
    source: 'owner-2026-10-07',
    reference: VIEWS,
    expected: 'text view with world unavailable: no header buttons',
  },
  {
    id: 'shell.controls.running',
    source: 'owner-2026-10-07',
    reference: `${VIEWS}; plan 0002 §9 S21 HeaderControls; §5.9 menus #autopilot-menu, #road-map`,
    expected:
      'world running: Autopilot and Road map with aria-expanded false and aria-controls autopilot-menu / road-map; «Text version» without aria-pressed; Sound with aria-pressed',
  },
  {
    id: 'shell.menu',
    source: 'apg',
    reference:
      'WAI-ARIA APG menu button (aria-expanded reflects the open menu); plan 0002 §5.1 WorldMenu',
    expected:
      'Autopilot → menu autopilot, expanded; Road map → menu map, Autopilot collapsed; Road map again → menu none',
  },
  {
    id: 'shell.sound',
    source: 'spec',
    reference: 'FR-037 (toggle «Sound on» / «Sound off», pressed state exposed)',
    expected:
      'after Take off: pressed true, «Sound on»; click → sound off, pressed false, «Sound off»; click → on again',
  },
  {
    id: 'shell.view-switch',
    source: 'spec',
    reference:
      'FR-006 (switching back resumes the same plane position, station state and visited set), FR-054 (source toggle); integration note S15 (stage stays mounted)',
    expected:
      '«Text version» → view text, one text_version_opened {source toggle}; «3D world» → view world, boot running, flight and visited unchanged, stage mounted once',
  },
  {
    id: 'shell.notice.no-webgl2',
    source: 'spec',
    reference: `${FAILURES}; NFR-005 (no WebGL1 path)`,
    expected:
      'no WebGL2 → view text, notice «3D is not available…», one text_version_opened {source fallback}, nothing loaded, no toggle',
  },
  {
    id: 'shell.notice.failed',
    source: 'spec',
    reference: FAILURES,
    expected:
      'renderer failure while loading → view text, notice «The 3D world did not load…», stage removed',
  },
  {
    id: 'shell.watchdog',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §4.2 step 3 (20 s watchdog → failWorld(timeout)); spec FR-004',
    expected:
      'loading schedules a 20000 ms timer; when it fires → boot failed timeout, view text, failure notice',
  },
  {
    id: 'shell.watchdog.cleared',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §4.2 step 3 (the watchdog guards loading only)',
    expected: 'ready before 20 s → the watchdog timer is cleared',
  },
  {
    id: 'shell.chunk-failed',
    source: 'spec',
    reference: FAILURES,
    expected:
      'stage chunk rejects → boot failed chunk-failed, view text, failure notice, one fallback event',
  },
  {
    id: 'shell.hud-chunk-failed',
    source: 'spec',
    reference: FAILURES,
    expected:
      'HUD chunk rejects → boot failed chunk-failed, view text, failure notice, main#text displayed',
  },
  {
    id: 'shell.stage-throws',
    source: 'spec',
    reference: `${FAILURES}; constitution §2.2 (3D never holds content hostage)`,
    expected:
      'the stage throws while rendering → boot failed renderer-failed, view text, failure notice, main#text with the children still displayed',
  },
  {
    id: 'shell.hud-throws',
    source: 'spec',
    reference: `${FAILURES}; constitution §2.2 (3D never holds content hostage)`,
    expected:
      'the HUD throws while rendering → boot failed chunk-failed, view text, failure notice, main#text with the children still displayed',
  },
  {
    id: 'shell.worker-failed',
    source: 'spec',
    reference: FAILURES,
    expected: 'generation rejects → boot failed worker-failed, view text, failure notice',
  },
  {
    id: 'shell.deep-link',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 D-6 (/#text); spec FR-054 (source deep-link)',
    expected:
      '#text → view text, one text_version_opened {source deep-link}, nothing loaded; «3D world» → view world and generation starts',
  },
  {
    id: 'shell.low-end',
    source: 'spec',
    reference:
      'FR-005, SC-003 (low-end: text default, «3D world» starts the world); plan 0002 D-23',
    expected:
      'deviceMemory 2 → view text, one text_version_opened {source low-end}, nothing loaded; «3D world» → loader shown and generation starts',
  },
  {
    id: 'shell.stage-props',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §5.5 WorldStageProps (generation, labels, navTemplate)',
    expected:
      'the stage receives the started generation promise, the nine station labels in order and the nav template',
  },
  {
    id: 'shell.hud-world-only',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §4.1 (hud/** — world view only)',
    expected: 'the HUD renders in world view and not in text view',
  },
  {
    id: 'shell.escape-css',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §4.3 (escape constant 12 s in CSS equals LOADER_ESCAPE_MS)',
    expected: 'computed --loader-escape on :root, in ms, equals LOADER_ESCAPE_MS',
  },
] as const satisfies readonly WorldShellCase[];

export type WorldShellCaseId = (typeof WORLD_SHELL_CASES)[number]['id'];
