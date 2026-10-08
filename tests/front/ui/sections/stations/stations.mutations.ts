import type { StationsCaseId } from '@tests/front/ui/sections/stations/stations.cases';

export type StationsMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly StationsCaseId[];
}>;

const HOME = 'src/sections/home-base/home-base.component.tsx';
const BRIEF = 'src/sections/mission-brief/mission-brief.component.tsx';
const SYSTEMS = 'src/sections/systems/systems.component.tsx';

export const STATIONS_MUTATIONS: readonly StationsMutation[] = [
  {
    id: 'home-h1-demoted',
    file: HOME,
    find: '<h1\n        id="home-base-title"\n        data-motion="title"\n        className="m-0 font-pixel text-title leading-display font-semibold text-balance text-white wide:text-title-wide"\n      >\n        {COPY.title}\n      </h1>',
    replace:
      '<h2\n        id="home-base-title"\n        data-motion="title"\n        className="m-0 font-pixel text-title leading-display font-semibold text-balance text-white wide:text-title-wide"\n      >\n        {COPY.title}\n      </h2>',
    caseIds: ['stations.home-base.heading', 'stations.heading-order'],
  },
  {
    id: 'home-title-id',
    file: HOME,
    find: 'id="home-base-title"',
    replace: 'id="home-title"',
    caseIds: ['stations.home-base.heading'],
  },
  {
    id: 'home-contact-target',
    file: HOME,
    find: '<StationLink station="contact"',
    replace: '<StationLink station="systems"',
    caseIds: ['stations.home-base.contact'],
  },
  {
    id: 'home-cv-button-back',
    file: HOME,
    find: '        <div data-motion="item">\n          <TrackedLink',
    replace:
      '        <div data-motion="item">\n          <button type="button">Download CV</button>\n        </div>\n\n        <div data-motion="item">\n          <TrackedLink',
    caseIds: ['stations.home-base.no-cv'],
  },
  {
    id: 'home-download-link-back',
    file: HOME,
    find: '<TrackedLink\n            href={COPY.linkedin.href}',
    replace:
      '<a href="/cv.pdf" download>CV</a>\n          <TrackedLink\n            href={COPY.linkedin.href}',
    caseIds: ['stations.home-base.no-cv'],
  },
  {
    id: 'home-linkedin-same-tab',
    file: HOME,
    find: '            external\n',
    replace: '',
    caseIds: ['stations.home-base.linkedin'],
  },
  {
    id: 'home-linkedin-event',
    file: HOME,
    find: "event={{ name: 'linkedin_click' }}",
    replace: "event={{ name: 'email_copy' }}",
    caseIds: ['stations.home-base.linkedin'],
  },
  {
    id: 'home-stat-value-motion',
    file: HOME,
    find: 'data-motion="stat-value"',
    replace: '',
    caseIds: ['stations.home-base.facts', 'stations.motion'],
  },
  {
    id: 'home-stat-motion',
    file: HOME,
    find: 'data-motion="stat"',
    replace: '',
    caseIds: ['stations.home-base.facts', 'stations.motion'],
  },
  {
    id: 'home-chip-motion',
    file: HOME,
    find: 'data-motion="chip"',
    replace: '',
    caseIds: ['stations.home-base.facts', 'stations.motion'],
  },
  {
    id: 'home-tag-motion',
    file: HOME,
    find: 'data-motion="tag"',
    replace: '',
    caseIds: ['stations.motion'],
  },
  {
    id: 'home-title-motion',
    file: HOME,
    find: 'data-motion="title"',
    replace: '',
    caseIds: ['stations.motion'],
  },
  {
    id: 'home-lede-motion',
    file: HOME,
    find: '<p data-motion="lede" className="mt-3',
    replace: '<p className="mt-3',
    caseIds: ['stations.motion'],
  },
  {
    id: 'home-stats-dropped',
    file: HOME,
    find: '{COPY.stats.map(',
    replace: '{COPY.stats.slice(0, 1).map(',
    caseIds: ['stations.home-base.facts'],
  },
  {
    id: 'brief-h2-demoted',
    file: BRIEF,
    find: '<h2\n        id={`${station}-title`}\n        data-motion="title"\n        className="m-0 font-pixel text-heading leading-display font-semibold text-balance text-white wide:text-heading-wide"\n      >\n        {copy.title}\n      </h2>',
    replace:
      '<h3\n        id={`${station}-title`}\n        data-motion="title"\n        className="m-0 font-pixel text-heading leading-display font-semibold text-balance text-white wide:text-heading-wide"\n      >\n        {copy.title}\n      </h3>',
    caseIds: ['stations.brief.heading', 'stations.heading-order'],
  },
  {
    id: 'brief-id',
    file: BRIEF,
    find: 'id={`${station}-title`}',
    replace: 'id={station}',
    caseIds: ['stations.brief.heading', 'stations.heading-order'],
  },
  {
    id: 'brief-title-swapped',
    file: BRIEF,
    find: '{copy.title}',
    replace: '{copy.label}',
    caseIds: ['stations.brief.heading', 'stations.server-html'],
  },
  {
    id: 'brief-tag-swapped',
    file: BRIEF,
    find: '{copy.tag}',
    replace: '{copy.label}',
    caseIds: ['stations.brief.body'],
  },
  {
    id: 'brief-items-capped',
    file: BRIEF,
    find: '{copy.items.map(',
    replace: '{copy.items.slice(0, 2).map(',
    caseIds: ['stations.brief.body'],
  },
  {
    id: 'brief-chips-capped',
    file: BRIEF,
    find: '{copy.chips.map(',
    replace: '{copy.chips.slice(0, 2).map(',
    caseIds: ['stations.brief.body'],
  },
  {
    id: 'brief-result-caption',
    file: BRIEF,
    find: '{copy.result.value}</b>',
    replace: '{copy.result.caption}</b>',
    caseIds: ['stations.brief.body'],
  },
  {
    id: 'brief-result-motion',
    file: BRIEF,
    find: 'data-motion="result"',
    replace: '',
    caseIds: ['stations.brief.body', 'stations.motion'],
  },
  {
    id: 'brief-lede-motion',
    file: BRIEF,
    find: 'data-motion="lede"',
    replace: '',
    caseIds: ['stations.brief.body', 'stations.motion'],
  },
  {
    id: 'brief-chip-motion',
    file: BRIEF,
    find: 'data-motion="chip"',
    replace: '',
    caseIds: ['stations.brief.body', 'stations.motion'],
  },
  {
    id: 'brief-item-motion',
    file: BRIEF,
    find: 'data-motion="item"',
    replace: '',
    caseIds: ['stations.brief.body', 'stations.motion'],
  },
  {
    id: 'brief-tag-motion',
    file: BRIEF,
    find: 'data-motion="tag"',
    replace: '',
    caseIds: ['stations.brief.body', 'stations.motion'],
  },
  {
    id: 'brief-title-motion',
    file: BRIEF,
    find: 'data-motion="title"',
    replace: '',
    caseIds: ['stations.motion'],
  },
  {
    id: 'systems-id',
    file: SYSTEMS,
    find: 'id="systems-title"',
    replace: 'id="systems"',
    caseIds: ['stations.systems', 'stations.heading-order'],
  },
  {
    id: 'systems-title-swapped',
    file: SYSTEMS,
    find: '{COPY.title}',
    replace: '{COPY.label}',
    caseIds: ['stations.systems', 'stations.server-html'],
  },
  {
    id: 'systems-groups-capped',
    file: SYSTEMS,
    find: '{COPY.groups.map(',
    replace: '{COPY.groups.slice(0, 3).map(',
    caseIds: ['stations.systems'],
  },
  {
    id: 'systems-items-capped',
    file: SYSTEMS,
    find: '{group.items.map(',
    replace: '{group.items.slice(0, 2).map(',
    caseIds: ['stations.systems'],
  },
  {
    id: 'systems-h3-demoted',
    file: SYSTEMS,
    find: '<h3 className="m-0 mb-1.5 font-pixel text-subhead font-medium text-white">\n                {group.title}\n\n                {group.years === null ? null : (\n                  <em className="ml-1 text-signal not-italic">{group.years}</em>\n                )}\n              </h3>',
    replace:
      '<h4 className="m-0 mb-1.5 font-pixel text-subhead font-medium text-white">\n                {group.title}\n\n                {group.years === null ? null : (\n                  <em className="ml-1 text-signal not-italic">{group.years}</em>\n                )}\n              </h4>',
    caseIds: ['stations.systems'],
  },
  {
    id: 'systems-chip-motion',
    file: SYSTEMS,
    find: 'data-motion="chip"',
    replace: '',
    caseIds: ['stations.motion'],
  },
  {
    id: 'systems-item-motion',
    file: SYSTEMS,
    find: 'data-motion="item"',
    replace: '',
    caseIds: ['stations.motion'],
  },
];
