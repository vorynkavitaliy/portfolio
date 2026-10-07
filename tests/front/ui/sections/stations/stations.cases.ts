export type StationsCaseSource = 'spec' | 'prototype' | 'content';

export type StationsCase = Readonly<{
  id: string;
  source: StationsCaseSource;
  reference: string;
  expected: string;
}>;

const PROTOTYPE_PANELS = 'prototype panels (:245-325)';

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
    id: 'stations.home-base.cv-link',
    source: 'spec',
    reference: 'plan S19: CV href comes from the prop, click is tracked',
    expected:
      'with an href the "Download CV" link points to it, has the download attribute and emits cv_download once per click',
  },
  {
    id: 'stations.home-base.cv-placeholder',
    source: 'spec',
    reference: 'plan S19: a null CV href renders a placeholder button',
    expected:
      'without an href "Download CV" is a disabled button and no link with that name exists',
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
    expected: 'stats 7+ / 2+ with their captions and the eight technology chips in order',
  },
  {
    id: 'stations.brief.heading',
    source: 'prototype',
    reference: `${PROTOTYPE_PANELS} missions`,
    expected:
      'each of the five brief stations renders one h2 with the id "<station>-title" and its title',
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
      'h2 id systems-title, the five group headings in order, Frontend with "7+ yrs", Node.js with "2 yrs", every chip of a group under its heading',
  },
  {
    id: 'stations.flight-log',
    source: 'prototype',
    reference: `${PROTOTYPE_PANELS} flight log`,
    expected:
      'h2 id flight-log-title and an ordered list of six entries, newest first, each with years, h3 role and summary',
  },
  {
    id: 'stations.heading-order',
    source: 'spec',
    reference: 'FR-045 and WCAG 1.3.1 (one h1, one h2 per station, h3 only below an h2)',
    expected:
      'all seven sections together hold one h1, seven h2 with unique ids and no h3 before the first h2 of its section',
  },
  {
    id: 'stations.motion',
    source: 'spec',
    reference: 'plan §5.9 motion targets',
    expected:
      'every section has data-motion tag, title and lede (or items for the log), brief sections have chip and result, home base has stat and stat-value',
  },
  {
    id: 'stations.server-html',
    source: 'spec',
    reference: 'SC no-JS shows all stations; FR-002',
    expected:
      'rendering the seven sections to a string without client effects contains every title, the name, the role and every flight log entry',
  },
] as const satisfies readonly StationsCase[];

export type StationsCaseId = (typeof STATIONS_CASES)[number]['id'];
