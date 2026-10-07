export type MinimapCaseSource = 'prototype' | 'spec';

export type MinimapCase = Readonly<{
  id: string;
  source: MinimapCaseSource;
  reference: string;
  expected: string;
}>;

const PICK =
  'spec FR-033 (click a station on the map to fly there); prototype :843–848, :847 radius 14 blocks';

export const MINIMAP_CASES = [
  {
    id: 'minimap.pick.exact',
    source: 'spec',
    reference: `${PICK}; map u,v run 0..1 across the 128-block world`,
    expected: 'a click on a station position returns its index',
  },
  {
    id: 'minimap.pick.axes',
    source: 'prototype',
    reference: `${PICK}; u is world x, v is world z`,
    expected: 'u maps to x and v to z: swapping them misses the station',
  },
  {
    id: 'minimap.pick.radius',
    source: 'prototype',
    reference: PICK,
    expected: '13.9 blocks from a station picks it; exactly 14 and 20 do not',
  },
  {
    id: 'minimap.pick.nearest',
    source: 'spec',
    reference: `${PICK}; nearest wins`,
    expected: 'with two stations in range the nearer one is returned, in either list order',
  },
  {
    id: 'minimap.pick.tie',
    source: 'prototype',
    reference: `${PICK}; strict comparison keeps the first of equals`,
    expected: 'two stations at the same distance return the lower index',
  },
  {
    id: 'minimap.pick.none',
    source: 'spec',
    reference: PICK,
    expected: 'an empty list and a click on open terrain return null',
  },
] as const satisfies readonly MinimapCase[];

export type MinimapCaseId = (typeof MINIMAP_CASES)[number]['id'];
