export type StationLinkCaseSource = 'spec' | 'mdn-docs' | 'owner-2026-10-07';

export type StationLinkCase = Readonly<{
  id: string;
  source: StationLinkCaseSource;
  reference: string;
  expected: string;
}>;

const FR_031 = 'FR-031 (choosing a station in the world flies there and docks)';

export const STATION_LINK_CASES = [
  {
    id: 'station-link.anchor',
    source: 'spec',
    reference: 'FR-002 (without JavaScript the text version navigates by anchors)',
    expected: 'renders a link with its text, href "#systems" and the given class',
  },
  {
    id: 'station-link.running.autopilot',
    source: 'spec',
    reference: FR_031,
    expected: 'in world view with boot running a click dispatches {type autopilot, station} once',
  },
  {
    id: 'station-link.running.prevent-default',
    source: 'mdn-docs',
    reference: 'MDN Event.preventDefault: the hash navigation is cancelled',
    expected: 'in world view with boot running the click is default-prevented',
  },
  {
    id: 'station-link.brand',
    source: 'spec',
    reference: 'FR-034 (the brand sends the plane back to Home base)',
    expected: 'a link to home-base in the running world dispatches autopilot to home-base',
  },
  {
    id: 'station-link.text-view',
    source: 'spec',
    reference: 'FR-002, FR-006 (the text version scrolls to the section)',
    expected: 'in text view a click is not prevented and nothing is dispatched',
  },
  {
    id: 'station-link.boot-view',
    source: 'spec',
    reference: 'FR-002 (before the world runs the anchor works)',
    expected: 'in boot view a click is not prevented and nothing is dispatched',
  },
  {
    id: 'station-link.not-running',
    source: 'spec',
    reference: 'FR-004 (a world that is not flying yet cannot take commands)',
    expected:
      'in world view while boot is idle, loading, ready or failed the click is not prevented and nothing is dispatched',
  },
  {
    id: 'station-link.reacts',
    source: 'owner-2026-10-07',
    reference: 'D-7: DOM reads the external store',
    expected:
      'the same mounted link starts commanding after the store moves to world + running, and stops after it moves to text',
  },
] as const satisfies readonly StationLinkCase[];

export type StationLinkCaseId = (typeof STATION_LINK_CASES)[number]['id'];
