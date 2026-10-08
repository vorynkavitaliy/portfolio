export type WorldActionsCaseSource = 'spec' | 'owner-2026-10-07' | 'owner-2026-10-08' | 'prototype';

export type WorldActionsCase = Readonly<{
  id: string;
  source: WorldActionsCaseSource;
  reference: string;
  expected: string;
}>;

const STATE = 'prototype :546–601 (setLinked / setPanel state transitions)';

const FAILS = 'FR-004 (no WebGL2, chunk or renderer failure opens the text version)';

export const WORLD_ACTIONS_CASES = [
  {
    id: 'world.stations.order',
    source: 'owner-2026-10-08',
    reference: 'owner-approved copy v2 (copy-v2-en.md), sections 1-9 order',
    expected:
      'STATION_IDS in order: home-base, full-cycle, frontend, backend, ai, deploy, systems, this-world, contact',
  },
  {
    id: 'world.stations.count',
    source: 'spec',
    reference: 'FR-021 (nine stations)',
    expected: 'STATION_IDS has nine entries',
  },
  {
    id: 'world.stations.index',
    source: 'prototype',
    reference: 'docs/prototype/index.html:361–371 (array position is the station index)',
    expected: 'stationIndex returns 0 for home-base, 6 for systems, 8 for contact',
  },
  {
    id: 'world.stations.at',
    source: 'prototype',
    reference: 'docs/prototype/index.html:361–371',
    expected:
      'stationAt(0) = home-base, stationAt(8) = contact, stationAt(9) and stationAt(-1) = null',
  },
  {
    id: 'world.actions.open-text',
    source: 'spec',
    reference: 'FR-006 (the HUD toggle switches the view at any time)',
    expected: 'openText sets view text, keeps the given reason and closes any open menu',
  },
  {
    id: 'world.actions.open-text.same',
    source: 'spec',
    reference: 'FR-006',
    expected: 'openText with the same reason on a text state with no menu returns the same object',
  },
  {
    id: 'world.actions.open-world',
    source: 'spec',
    reference: 'FR-006 (switching back resumes the world)',
    expected:
      'openWorld sets view world and clears the text reason; on a world state it is the same object',
  },
  {
    id: 'world.actions.keep-state-on-switch',
    source: 'spec',
    reference: 'FR-006 (switching back resumes the same station state and visited set)',
    expected: 'openText then openWorld keeps visited and flight unchanged',
  },
  {
    id: 'world.actions.world-available',
    source: 'spec',
    reference: 'FR-004 (text version offers «3D world» only when the world can run)',
    expected: 'setWorldAvailable sets the flag; the same value returns the same object',
  },
  {
    id: 'world.actions.start-loading',
    source: 'spec',
    reference: 'FR-004 (loader never stays forever; loading has a defined start)',
    expected:
      'idle → loading with worker 0 and engine false; from any other status the same object',
  },
  {
    id: 'world.actions.worker-progress',
    source: 'spec',
    reference: 'FR-004 (loader progress)',
    expected: 'setWorkerProgress stores 0.4 as 0.4, clamps 1.7 to 1 and −0.2 to 0 while loading',
  },
  {
    id: 'world.actions.worker-progress.not-loading',
    source: 'spec',
    reference: 'FR-004',
    expected: 'setWorkerProgress outside loading (idle, ready) returns the same object',
  },
  {
    id: 'world.actions.engine-loaded',
    source: 'spec',
    reference: 'FR-004',
    expected:
      'setEngineLoaded sets engine true while loading and keeps worker; outside loading the same object',
  },
  {
    id: 'world.actions.mark-ready',
    source: 'spec',
    reference: 'FR-004 (Take off becomes available only once the world is ready)',
    expected: 'markReady: loading → ready; from idle, running or failed the same object',
  },
  {
    id: 'world.actions.take-off',
    source: 'spec',
    reference: 'FR-037 (Take off starts the flight and turns sound on)',
    expected: 'takeOff on ready → boot running, flight intro, menu none, flash {seq 1, take-off}',
  },
  {
    id: 'world.actions.take-off.sound',
    source: 'owner-2026-10-07',
    reference: 'Q-9 B: «Take off» turns sound on inside its click',
    expected: 'takeOff sets sound true',
  },
  {
    id: 'world.actions.take-off.not-ready',
    source: 'spec',
    reference: 'FR-037 (sound never starts before a visitor action on a ready world)',
    expected:
      'takeOff on idle, loading, running or failed returns the same object, sound stays false',
  },
  {
    id: 'world.actions.take-off.flash-seq',
    source: 'owner-2026-10-07',
    reference: 'plan §5.1: takeOff flash {seq+1}',
    expected: 'with a previous flash of seq 4 takeOff makes seq 5',
  },
  {
    id: 'world.actions.fail.no-webgl2',
    source: 'spec',
    reference: FAILS,
    expected:
      'failWorld(no-webgl2): boot failed with that reason, view text, textReason no-webgl2, worldAvailable false, menu none',
  },
  {
    id: 'world.actions.fail.other',
    source: 'spec',
    reference: FAILS,
    expected:
      'failWorld with chunk-failed, worker-failed, renderer-failed, context-lost or timeout: view text, textReason failed, boot failed with the reason, worldAvailable false',
  },
  {
    id: 'world.actions.fail.from-running',
    source: 'spec',
    reference: 'FR-004 (also a renderer that dies after take-off, context lost)',
    expected:
      'failWorld on a running world with an open map menu closes the menu and opens the text view',
  },
  {
    id: 'world.actions.fail.first-reason-wins',
    source: 'spec',
    reference: FAILS,
    expected:
      'failWorld on an already failed world returns the same state object, so the first reason stays and nothing is notified twice',
  },
  {
    id: 'world.actions.set-menu',
    source: 'spec',
    reference: 'FR-031, FR-033 (Autopilot menu and Road map)',
    expected: 'setMenu stores autopilot and map; the same menu returns the same object',
  },
  {
    id: 'world.actions.set-sound',
    source: 'spec',
    reference: 'FR-037 (HUD toggle turns sound off and on again)',
    expected: 'setSound true/false stores the value; the same value returns the same object',
  },
  {
    id: 'world.actions.set-flight',
    source: 'prototype',
    reference: STATE,
    expected:
      'setFlight stores free, autopilot and docked phases with their station; an equal phase returns the same object; autopilot to another target is a new object',
  },
  {
    id: 'world.actions.visited.first-order',
    source: 'spec',
    reference: 'FR-027 (stations can be docked in any order)',
    expected: 'addVisited keeps the order of first visits: systems, contact, home-base',
  },
  {
    id: 'world.actions.visited.dedupe',
    source: 'spec',
    reference: 'SC-012 (re-docking does not raise the counter)',
    expected: 'adding home-base twice leaves one entry and the second call returns the same object',
  },
  {
    id: 'world.actions.visited.count',
    source: 'spec',
    reference: 'SC-012 (home-base then three further stations reads 4, a repeat stays 4)',
    expected: 'visited length is 4 after home-base and three others, still 4 after a repeat',
  },
  {
    id: 'world.actions.input-used',
    source: 'prototype',
    reference: 'docs/prototype/index.html:393 (noteInput sets input.used and hides the hint)',
    expected: 'markInputUsed sets inputUsed true; again returns the same object',
  },
  {
    id: 'world.actions.slow',
    source: 'spec',
    reference: 'FR-040 (a persistently slow device gets the slow prompt)',
    expected: 'markSlow sets slow true; again returns the same object',
  },
  {
    id: 'world.actions.flash-send',
    source: 'spec',
    reference: 'FR-037 (a chime and celebration on a sent message)',
    expected:
      'flashSend with no flash gives {seq 1, send}; after a take-off flash of seq 1 it gives seq 2',
  },
  {
    id: 'world.actions.pure',
    source: 'owner-2026-10-07',
    reference: 'plan §5.1: pure (state, …) => state',
    expected: 'no action mutates a frozen input state, its flight, boot or visited array',
  },
] as const satisfies readonly WorldActionsCase[];

export type WorldActionsCaseId = (typeof WORLD_ACTIONS_CASES)[number]['id'];
