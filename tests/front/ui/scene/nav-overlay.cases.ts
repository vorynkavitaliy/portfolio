export type NavOverlayCaseSource = 'spec' | 'prototype' | 'owner-2026-10-07';

export type NavOverlayCase = Readonly<{
  id: string;
  source: NavOverlayCaseSource;
  reference: string;
  expected: string;
}>;

const NAV = 'spec FR-029, FR-030; prototype :1428–1488; plan §5.9 DOM contract';

export const NAV_OVERLAY_CASES = [
  {
    id: 'nav.dom',
    source: 'spec',
    reference: NAV,
    expected:
      'one [data-nav-label="<id>"][data-visible="false"] per station and a hidden [data-nav-edge] with arrow and name',
  },
  {
    id: 'nav.text',
    source: 'spec',
    reference: `${NAV}; content navLabel '{name} · {distance}m'`,
    expected:
      'a visible label shows the template with the name and the 3D distance to the plane rounded to metres, placed at the projected point',
  },
  {
    id: 'nav.projection',
    source: 'spec',
    reference: `${NAV}; :1450–1470`,
    expected:
      'a station right of and above the view centre lands where three projects its top lifted 12 blocks',
  },
  {
    id: 'nav.visible',
    source: 'spec',
    reference: `${NAV}; labelVisible`,
    expected:
      'in front and within 160 blocks is visible; behind the camera, off the side or beyond 160 is not; the target shows beyond 160',
  },
  {
    id: 'nav.target',
    source: 'spec',
    reference: NAV,
    expected: 'data-target sits on the target label only and follows targetIndex; −1 clears it',
  },
  {
    id: 'nav.edge',
    source: 'spec',
    reference: `${NAV}; FR-030 edge arrow`,
    expected:
      'an off-screen target shows the edge with its name, a behind target clamps to the top margin; an on-screen or missing target hides it',
  },
  {
    id: 'nav.edge-angle',
    source: 'prototype',
    reference: `${NAV}; :1478–1479`,
    expected:
      'a target to the right puts the edge on the right margin and rotates the arrow 1.571 rad',
  },
  {
    id: 'nav.no-redundant-writes',
    source: 'spec',
    reference: 'plan S16 (no per-frame DOM writes when nothing changed)',
    expected: 'a second update with the same frame mutates nothing',
  },
  {
    id: 'nav.set-visible',
    source: 'prototype',
    reference: 'prototype :1604 (nav layer fades in on take off); globals.css:267 [data-on="true"]',
    expected:
      'setVisible sets data-on to "true" and "false" on the layer; CSS owns the fade; computed opacity is 1 when data-on="true", 0 when data-on="false"',
  },
  {
    id: 'nav.dispose',
    source: 'spec',
    reference: 'plan S16 review focus (cleanup)',
    expected: 'dispose removes every label and the edge from the root',
  },
] as const satisfies readonly NavOverlayCase[];

export type NavOverlayCaseId = (typeof NAV_OVERLAY_CASES)[number]['id'];
