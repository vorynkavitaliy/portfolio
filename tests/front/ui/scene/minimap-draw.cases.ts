export type MinimapDrawCaseSource = 'spec' | 'prototype' | 'owner-2026-10-07';

export type MinimapDrawCase = Readonly<{
  id: string;
  source: MinimapDrawCaseSource;
  reference: string;
  expected: string;
}>;

const DRAW = 'spec FR-033; prototype :814–841';

export const MINIMAP_DRAW_CASES = [
  {
    id: 'minimap.draw.image',
    source: 'spec',
    reference: DRAW,
    expected: 'the canvas takes the frame size and shows the terrain image pixel for pixel',
  },
  {
    id: 'minimap.draw.stations',
    source: 'prototype',
    reference: `${DRAW}; :824–828`,
    expected: 'a lit station is amber, an unvisited one white, each with a dark core',
  },
  {
    id: 'minimap.draw.plane',
    source: 'prototype',
    reference: `${DRAW}; :829–838`,
    expected: 'the red plane triangle points along its yaw: yaw 0 points toward +z, yaw π away',
  },
  {
    id: 'minimap.draw.no-plane',
    source: 'prototype',
    reference: `${DRAW}; :830 finite guard`,
    expected: 'a null plane or non-finite coordinates draw no red',
  },
] as const satisfies readonly MinimapDrawCase[];

export type MinimapDrawCaseId = (typeof MINIMAP_DRAW_CASES)[number]['id'];
