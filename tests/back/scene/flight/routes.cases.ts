export type RoutesCaseSource = 'spec' | 'owner-2026-10-07';

export type RoutesCase = Readonly<{
  id: string;
  source: RoutesCaseSource;
  reference: string;
  expected: string;
}>;

const SC004 =
  'spec SC-004 (keyboard-only route from Home docks at each station); plan S14 (a), pilot reads bearing only';

const SC008 = 'spec SC-008 (autopilot docks within 40 s from every station to every other)';

const SC007 =
  'spec SC-007 (≥ 2.5 above terrain or water in every frame; never above 80), real fixed-seed map';

const SC006 =
  'spec SC-006 / plan §1 (back inside the map within 10 s of crossing the margin, never stops), real map';

export const ROUTES_CASES = [
  {
    id: 'routes.keyboard.stations',
    source: 'spec',
    reference: `${SC004}; A/D when |bearing error| > 0.15 rad plus Shift, one fixed waypoint table per station`,
    expected:
      'from the Home dock after take-off, each of stations 1–8 is the first and only dock, within 40 s',
  },
  {
    id: 'routes.keyboard.home',
    source: 'spec',
    reference: `${SC004}; plan S14 (a): Home re-dock after leaving more than 24 blocks`,
    expected: 'after Home is farther than 24 blocks the pilot docks at Home again within 40 s',
  },
  {
    id: 'routes.keyboard.safe',
    source: 'spec',
    reference: `${SC007}; keyboard pilot routes`,
    expected: 'every keyboard route stays ≥ 2.5 above the surface and ≤ 80',
  },
  {
    id: 'routes.autopilot.all-pairs',
    source: 'spec',
    reference: `${SC008}; every ordered station pair from four approach sides, 1/60`,
    expected:
      'the plane docks at the chosen station within 40 s, and that is the only docked event',
  },
  {
    id: 'routes.autopilot.safe',
    source: 'spec',
    reference: `${SC007}; every autopilot route`,
    expected: 'every autopilot route stays ≥ 2.5 above the surface and ≤ 80',
  },
  {
    id: 'routes.floor.descend',
    source: 'spec',
    reference: `${SC007}; holding descend 30 s over the highest column, the widest flat plateau and the widest open water, four headings, cruise and boost, dt 1/60 and 0.05`,
    expected:
      'the margin above max(height, sea) is ≥ 2.5 at every step and the plane comes within 6 of the surface',
  },
  {
    id: 'routes.ceiling.climb',
    source: 'spec',
    reference: `${SC007}; holding climb 30 s from the same three places, dt 1/60 and 0.05`,
    expected: 'y never exceeds 80 and reaches the ceiling',
  },
  {
    id: 'routes.edge.return',
    source: 'spec',
    reference: `${SC006}; 8 headings, cruise and boost, from the map centre and every station, no input`,
    expected:
      'every run crosses 82, is back inside |x|,|z| ≤ 64 within 10 s of crossing, and speed never falls below 13',
  },
  {
    id: 'routes.edge.floor',
    source: 'spec',
    reference: `${SC007}; edge-return runs over the real map`,
    expected: 'the surface margin stays ≥ 2.5 and y ≤ 80 in every edge-return run',
  },
] as const satisfies readonly RoutesCase[];

export type RoutesCaseId = (typeof ROUTES_CASES)[number]['id'];
