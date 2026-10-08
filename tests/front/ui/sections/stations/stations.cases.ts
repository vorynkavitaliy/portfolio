export type StationsCaseSource = 'spec' | 'prototype' | 'content' | 'owner-2026-10-08';

export type StationsCase = Readonly<{
  id: string;
  source: StationsCaseSource;
  reference: string;
  expected: string;
}>;

const PROTOTYPE_PANELS = 'owner-approved copy v2 (copy-v2-en.md)';

export const STATIONS_CASES = [
  {
    id: 'stations.home-base.heading',
    source: 'prototype',
    reference: `${PROTOTYPE_PANELS}, FR-001`,
    expected:
      'one h1 "Vitalii Vorynka" with id home-base-title, the tag "Pilot on duty", the role and the lede',
  },
  {
    id: 'stations.home-base.contact',
    source: 'spec',
    reference: 'FR-042 (CTA flies to Contact; plain anchor without JavaScript)',
    expected: 'a link "Contact" to #contact',
  },
  {
    id: 'stations.home-base.no-cv',
    source: 'owner-2026-10-08',
    reference: 'owner 2026-10-08: remove «Download CV» from home base',
    expected:
      'home base shows no CV text, no button and no download link; only the Contact and LinkedIn links remain',
  },
  {
    id: 'stations.home-base.linkedin',
    source: 'prototype',
    reference: `${PROTOTYPE_PANELS} LinkedIn CTA`,
    expected:
      'link "LinkedIn" to the profile URL opening in a new tab with rel noopener, emitting linkedin_click once per click',
  },
  {
    id: 'stations.home-base.facts',
    source: 'prototype',
    reference: `${PROTOTYPE_PANELS} stats and chips`,
    expected:
      'stats 7+ years in production / 20+ projects and the ten technology chips of the copy file in order',
  },
  {
    id: 'stations.brief.heading',
    source: 'prototype',
    reference: `${PROTOTYPE_PANELS} missions`,
    expected:
      'each of the six brief stations renders one h2 with the id "<station>-title" and its title',
  },
  {
    id: 'stations.brief.body',
    source: 'prototype',
    reference: `${PROTOTYPE_PANELS} missions`,
    expected:
      'tag, lede, the list of items, the chips and the result figure of each brief match the prototype counts and the result value',
  },
  {
    id: 'stations.systems',
    source: 'prototype',
    reference: `${PROTOTYPE_PANELS} systems`,
    expected:
      'h2 id systems-title, the six group headings in order (Frontend, Backend, Integrations, DevOps, AI, Tools and 3D), no years labels, every chip of a group under its heading',
  },
  {
    id: 'stations.heading-order',
    source: 'spec',
    reference: 'FR-045 and WCAG 1.3.1 (one h1, one h2 per station, h3 only below an h2)',
    expected:
      'all eight sections together hold one h1, seven h2 with unique ids and no h3 before the first h2 of its section',
  },
  {
    id: 'stations.motion',
    source: 'spec',
    reference: 'plan §5.9 motion targets',
    expected:
      'every section has data-motion tag, title and item; brief sections have lede and result, and chips only where the copy lists chips; systems has no lede, home base has stat and stat-value',
  },
  {
    id: 'stations.server-html',
    source: 'spec',
    reference: 'SC no-JS shows all stations; FR-002',
    expected:
      'rendering the sections to a string without client effects contains every title, the name, the role and the stack title',
  },
] as const satisfies readonly StationsCase[];

export type StationsCaseId = (typeof STATIONS_CASES)[number]['id'];
