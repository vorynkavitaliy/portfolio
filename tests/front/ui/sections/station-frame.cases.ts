export type StationFrameCaseSource = 'spec' | 'prototype' | 'content';

export type StationFrameCase = Readonly<{
  id: string;
  source: StationFrameCaseSource;
  reference: string;
  expected: string;
}>;

export const STATION_FRAME_CASES = [
  {
    id: 'station-frame.contract',
    source: 'spec',
    reference: 'plan §5.9 station row and wipe target',
    expected:
      'a section with id and data-station "systems", aria-labelledby "systems-title", an aria-hidden wipe span with data-motion "wipe", and the children inside',
  },
  {
    id: 'station-frame.pixel-edge',
    source: 'spec',
    reference: 'plan S19: the pixel-edge class on StationFrame',
    expected: 'the section carries the pixel-edge class',
  },
  {
    id: 'station-frame.boot-view',
    source: 'spec',
    reference: 'FR-001 and plan §4.3 boot row (text layout, no world controls)',
    expected: 'in boot view the section is not inert, has no data-docked and no Take off button',
  },
  {
    id: 'station-frame.text-view',
    source: 'spec',
    reference: 'FR-045 and plan §4.3 text row (none inert)',
    expected:
      'in text view the section is not inert even when the store says docked here, and has no Take off button',
  },
  {
    id: 'station-frame.world-hidden',
    source: 'spec',
    reference: 'FR-028 (only the docked panel takes input)',
    expected:
      'in world view while flying free the section is inert, has no data-docked, and the button exists',
  },
  {
    id: 'station-frame.world-docked',
    source: 'spec',
    reference: 'plan §5.9: data-docked when docked, inert when hidden in world view',
    expected: 'in world view docked at this station the section is not inert and has data-docked',
  },
  {
    id: 'station-frame.docked-elsewhere',
    source: 'spec',
    reference: 'FR-028',
    expected: 'in world view docked at another station the section is inert and has no data-docked',
  },
  {
    id: 'station-frame.take-off-dispatch',
    source: 'spec',
    reference: 'FR-025 (Take off button on the docked panel)',
    expected:
      'a click on the docked panel button dispatches {type take-off} exactly once; the label is "Take off"',
  },
  {
    id: 'station-frame.take-off-keyboard',
    source: 'spec',
    reference: 'FR-025 and WCAG 2.1.1 (the button works from the keyboard)',
    expected:
      'the docked panel button takes focus and Enter dispatches take-off once; Space dispatches it once more',
  },
  {
    id: 'station-frame.key-hint',
    source: 'spec',
    reference: 'plan S19: the (Space) hint is aria-hidden and hidden on coarse pointers',
    expected:
      'the hint reads "(Space)", is aria-hidden, carries the coarse:hidden class, and the button name is "Take off" only',
  },
  {
    id: 'station-frame.reacts',
    source: 'spec',
    reference: 'D-7: DOM reads the external store',
    expected:
      'the same mounted frame goes from not inert to inert, to docked, and back to not inert after the store moves boot, world free, docked, text',
  },
] as const satisfies readonly StationFrameCase[];

export type StationFrameCaseId = (typeof STATION_FRAME_CASES)[number]['id'];
