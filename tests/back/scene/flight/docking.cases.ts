export type DockingCaseSource = 'prototype' | 'spec' | 'scene-rule';

export type DockingCase = Readonly<{
  id: string;
  source: DockingCaseSource;
  reference: string;
  expected: string;
}>;

const PROTO_LINK = 'prototype docs/prototype/index.html :1235–1264 (link, unlink, autopilot)';
const PROTO_CHECK = 'prototype :1339–1347 (checkLinks)';
const DOCKING = 'spec FR-022 (within 15 blocks horizontally; free or autopilot to that station)';
const TAKE_OFF = 'spec FR-025 / FR-026 / SC-005 (explicit take-off; no re-dock until > 24 away)';
const AUTOPILOT = 'spec FR-031 / FR-032';

export const DOCKING_CASES = [
  {
    id: 'docking.create',
    source: 'prototype',
    reference: 'prototype :385, :1222–1223 (orbit k 0, sgn 1, nothing visited, intro running)',
    expected: 'mode intro, orbitSide 1, cooldown 0, visited 0, introDone false',
  },
  {
    id: 'docking.intro.never-docks',
    source: 'spec',
    reference: `spec FR-008 (no station can dock until the intro ends); ${PROTO_CHECK} :1344`,
    expected:
      'during the intro a plane on top of station 3 gets no event and stays in intro; a reset before the intro ends (mode free) still docks nothing',
  },
  {
    id: 'docking.intro-done.docks-home',
    source: 'spec',
    reference: `spec FR-008 / FR-027 (Home docks after the intro, counter 1/9); ${PROTO_LINK}, evaluated from the Home orbit pose on flat`,
    expected:
      'one event docked 0 firstVisit true; visited = Home only; dock (−27.11522368914976, 18, 22.115223689149765); orbitSide 1',
  },
  {
    id: 'docking.free.link-range',
    source: 'spec',
    reference: `${DOCKING}; ${PROTO_CHECK} (d < 15, horizontal)`,
    expected:
      'free at 14.9 blocks (60 blocks above) docks station 2; at exactly 15 nothing happens',
  },
  {
    id: 'docking.dock-point',
    source: 'prototype',
    reference: `${PROTO_LINK} :1238–1244, evaluated: cliff, plane (13.5, 25, −55.5), yaw 2`,
    expected: 'docked 3 with dock (12.346153846153847, 44, −52.73076923076923) and orbitSide −1',
  },
  {
    id: 'docking.dock-point.degenerate',
    source: 'prototype',
    reference: `${PROTO_LINK} :1241 (offset < 0.1 → +z), evaluated: flat, plane over station 4`,
    expected: 'dock point (26.5, 17, −9.5)',
  },
  {
    id: 'docking.autopilot.passes-non-target',
    source: 'spec',
    reference: `${DOCKING} (passing another station on autopilot does not dock); ${PROTO_CHECK} :1345`,
    expected: 'autopilot to 5 over station 2 gives no event and keeps the autopilot target 5',
  },
  {
    id: 'docking.autopilot.target-docks',
    source: 'spec',
    reference: DOCKING,
    expected: 'autopilot to 5 within 10 blocks of station 5 docks station 5',
  },
  {
    id: 'docking.docked.ignores-steer',
    source: 'spec',
    reference: 'spec FR-024 (input does not move a docked plane; it stays until take-off)',
    expected: 'docked at 2, full steer with boost gives no event and the same mode object',
  },
  {
    id: 'docking.takeoff',
    source: 'spec',
    reference: `${TAKE_OFF}; ${PROTO_LINK} :1248–1254`,
    expected: 'take-off from 2 gives [undocked 2], mode free, cooldown holds station 2 only',
  },
  {
    id: 'docking.takeoff.cooldown',
    source: 'spec',
    reference: `${TAKE_OFF}; ${PROTO_CHECK} :1343`,
    expected:
      'after take-off: at 10, then 22, then 10 again no event; after 24.5 away, at 10 it docks 2 with firstVisit false and visited unchanged',
  },
  {
    id: 'docking.takeoff.other-stations',
    source: 'spec',
    reference: `${TAKE_OFF} (other stations dock normally)`,
    expected: 'right after take-off from 2, a plane near station 3 docks 3',
  },
  {
    id: 'docking.takeoff.ignored',
    source: 'prototype',
    reference: `${PROTO_LINK} :1249 (only from orbit after the intro)`,
    expected: 'take-off while free, or during the intro, returns no events and changes nothing',
  },
  {
    id: 'docking.visited.count',
    source: 'spec',
    reference: 'spec SC-012 / FR-027 (distinct stations; re-dock does not raise it)',
    expected: 'Home + 3 further stations → 4 visited; re-docking one keeps 4 with firstVisit false',
  },
  {
    id: 'docking.autopilot.current',
    source: 'spec',
    reference: `${AUTOPILOT} (choosing the current station does nothing); ${PROTO_LINK} :1259`,
    expected: 'docked at 2, autopilot 2 returns no events and keeps the mode',
  },
  {
    id: 'docking.autopilot.while-docked',
    source: 'spec',
    reference: `${AUTOPILOT} (another while docked undocks and flies); ${PROTO_LINK} :1260–1263`,
    expected:
      'docked at 2, autopilot 6 → [undocked 2, autopilot-started 6], mode autopilot 6, cooldown holds 2',
  },
  {
    id: 'docking.autopilot.clears-target-cooldown',
    source: 'prototype',
    reference: `${PROTO_LINK} :1261 (cool.delete(k))`,
    expected: 'after take-off from 2, autopilot back to 2 docks it at 10 blocks',
  },
  {
    id: 'docking.autopilot.cancel',
    source: 'spec',
    reference: `${AUTOPILOT} (steering beyond the dead zone cancels); prototype :1497 (mag > 0.35)`,
    expected: 'magnitude 0.35 keeps the autopilot; 0.36 gives autopilot-cancelled and mode free',
  },
  {
    id: 'docking.autopilot.invalid',
    source: 'prototype',
    reference: `${PROTO_LINK} :1258`,
    expected: 'station −1, 9, 1.5 or NaN, or any station before the intro ends, returns no events',
  },
  {
    id: 'docking.reset',
    source: 'spec',
    reference: 'spec FR-020; plan D-24 (Home orbit pose, mode free, no cooldown)',
    expected:
      'reset event; plane at (−36.30761184457488, 21, 31.307611844574883); mode free; cooldown 0; visited kept',
  },
  {
    id: 'docking.sim.autopilot',
    source: 'prototype',
    reference: `${AUTOPILOT}; prototype :1257–1347 evaluated: flat, Home docked 5 s, autopilot to 7, 1/60, integrate then checkLinks`,
    expected:
      'docks station 7 on step 279; events [undocked 0, autopilot-started 7, docked 7 firstVisit true]',
  },
] as const satisfies readonly DockingCase[];

export type DockingCaseId = (typeof DOCKING_CASES)[number]['id'];
