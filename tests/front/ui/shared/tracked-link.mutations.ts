import type { TrackedLinkCaseId } from '@tests/front/ui/shared/tracked-link.cases';

export type TrackedLinkMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly TrackedLinkCaseId[];
}>;

const FILE = 'src/shared/tracked-link.client.tsx';

export const TRACKED_LINK_MUTATIONS: readonly TrackedLinkMutation[] = [
  {
    id: 'href-dropped',
    file: FILE,
    find: '      href={href}\n',
    replace: '',
    caseIds: ['tracked-link.renders'],
  },
  {
    id: 'class-dropped',
    file: FILE,
    find: '      className={className}\n',
    replace: '',
    caseIds: ['tracked-link.renders'],
  },
  {
    id: 'never-tracks',
    file: FILE,
    find: '        track(event);\n',
    replace: '',
    caseIds: [
      'tracked-link.click-once',
      'tracked-link.two-clicks',
      'tracked-link.cv',
      'tracked-link.linkedin',
      'tracked-link.email',
    ],
  },
  {
    id: 'tracks-twice',
    file: FILE,
    find: '        track(event);\n',
    replace: '        track(event);\n        track(event);\n',
    caseIds: ['tracked-link.click-once', 'tracked-link.two-clicks', 'tracked-link.email'],
  },
  {
    id: 'tracks-on-focus',
    file: FILE,
    find: '      onClick={() => {',
    replace: '      onFocus={() => {\n        track(event);\n      }}\n      onClick={() => {',
    caseIds: ['tracked-link.no-click-no-event'],
  },
  {
    id: 'tracks-on-render',
    file: FILE,
    find: '  return (\n    <a',
    replace: '  track(event);\n\n  return (\n    <a',
    caseIds: ['tracked-link.no-click-no-event'],
  },
  {
    id: 'download-always',
    file: FILE,
    find: "download={download === true ? '' : undefined}",
    replace: "download=''",
    caseIds: ['tracked-link.renders'],
  },
  {
    id: 'download-dropped',
    file: FILE,
    find: "download={download === true ? '' : undefined}",
    replace: 'download={undefined}',
    caseIds: ['tracked-link.cv'],
  },
  {
    id: 'target-always',
    file: FILE,
    find: "target={external === true ? '_blank' : undefined}",
    replace: "target='_blank'",
    caseIds: ['tracked-link.renders', 'tracked-link.internal'],
  },
  {
    id: 'target-dropped',
    file: FILE,
    find: "target={external === true ? '_blank' : undefined}",
    replace: 'target={undefined}',
    caseIds: ['tracked-link.external'],
  },
  {
    id: 'rel-always',
    file: FILE,
    find: "rel={external === true ? 'noopener' : undefined}",
    replace: "rel='noopener'",
    caseIds: ['tracked-link.renders', 'tracked-link.internal'],
  },
  {
    id: 'rel-dropped',
    file: FILE,
    find: "rel={external === true ? 'noopener' : undefined}",
    replace: 'rel={undefined}',
    caseIds: ['tracked-link.external'],
  },
  {
    id: 'rel-wrong',
    file: FILE,
    find: "'noopener'",
    replace: "'nofollow'",
    caseIds: ['tracked-link.external'],
  },
];
