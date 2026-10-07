import type { StationLinkCaseId } from '@tests/front/ui/shared/station-link.cases';

export type StationLinkMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly StationLinkCaseId[];
}>;

const FILE = 'src/shared/station-link.client.tsx';

export const STATION_LINK_MUTATIONS: readonly StationLinkMutation[] = [
  {
    id: 'href.without-hash',
    file: FILE,
    find: 'href={`#${station}`}',
    replace: 'href={station}',
    caseIds: ['station-link.anchor'],
  },
  {
    id: 'class-dropped',
    file: FILE,
    find: '      className={className}\n',
    replace: '',
    caseIds: ['station-link.anchor'],
  },
  {
    id: 'never-prevents',
    file: FILE,
    find: '    event.preventDefault();\n',
    replace: '',
    caseIds: ['station-link.running.prevent-default'],
  },
  {
    id: 'never-dispatches',
    file: FILE,
    find: "    worldStore.dispatch({ type: 'autopilot', station });\n",
    replace: '',
    caseIds: ['station-link.running.autopilot', 'station-link.brand', 'station-link.reacts'],
  },
  {
    id: 'dispatches-fixed-station',
    file: FILE,
    find: "dispatch({ type: 'autopilot', station })",
    replace: "dispatch({ type: 'autopilot', station: 'systems' })",
    caseIds: ['station-link.brand'],
  },
  {
    id: 'ignores-view',
    file: FILE,
    find: "state.view === 'world' && state.boot.status === 'running'",
    replace: "state.boot.status === 'running'",
    caseIds: ['station-link.text-view', 'station-link.reacts'],
  },
  {
    id: 'ignores-boot',
    file: FILE,
    find: "state.view === 'world' && state.boot.status === 'running'",
    replace: "state.view === 'world'",
    caseIds: ['station-link.not-running'],
  },
  {
    id: 'ready-counts-as-flying',
    file: FILE,
    find: "state.boot.status === 'running'",
    replace: "(state.boot.status === 'running' || state.boot.status === 'ready')",
    caseIds: ['station-link.not-running'],
  },
  {
    id: 'always-flying',
    file: FILE,
    find: '    if (!flying) {\n      return;\n    }\n',
    replace: '',
    caseIds: [
      'station-link.text-view',
      'station-link.boot-view',
      'station-link.not-running',
      'station-link.reacts',
    ],
  },
  {
    id: 'frozen-at-ssr-snapshot',
    file: FILE,
    find: "  const flying: boolean = useWorld((state) => {\n    return state.view === 'world' && state.boot.status === 'running';\n  });",
    replace: '  const flying = false;',
    caseIds: [
      'station-link.running.autopilot',
      'station-link.running.prevent-default',
      'station-link.brand',
      'station-link.reacts',
    ],
  },
];
