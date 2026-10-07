import type { StationFrameCaseId } from '@tests/front/ui/sections/station-frame/station-frame.cases';

export type StationFrameMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly StationFrameCaseId[];
}>;

const FILE = 'src/sections/world/station-frame.client.tsx';

export const STATION_FRAME_MUTATIONS: readonly StationFrameMutation[] = [
  {
    id: 'id-dropped',
    file: FILE,
    find: '      id={station}\n',
    replace: '',
    caseIds: ['station-frame.contract'],
  },
  {
    id: 'labelledby-wrong',
    file: FILE,
    find: 'aria-labelledby={`${station}-title`}',
    replace: 'aria-labelledby={`${station}`}',
    caseIds: ['station-frame.contract'],
  },
  {
    id: 'wipe-visible-to-at',
    file: FILE,
    find: '        aria-hidden="true"\n        className="pointer-events-none',
    replace: '        className="pointer-events-none',
    caseIds: ['station-frame.contract'],
  },
  {
    id: 'wipe-motion-dropped',
    file: FILE,
    find: '        data-motion="wipe"\n',
    replace: '',
    caseIds: ['station-frame.contract'],
  },
  {
    id: 'pixel-edge-dropped',
    file: FILE,
    find: 'className="relative pixel-edge"',
    replace: 'className="relative"',
    caseIds: ['station-frame.pixel-edge'],
  },
  {
    id: 'never-inert',
    file: FILE,
    find: 'inert={inWorld && !docked}',
    replace: 'inert={false}',
    caseIds: [
      'station-frame.world-hidden',
      'station-frame.docked-elsewhere',
      'station-frame.reacts',
    ],
  },
  {
    id: 'inert-in-text-view',
    file: FILE,
    find: 'inert={inWorld && !docked}',
    replace: 'inert={!docked}',
    caseIds: ['station-frame.boot-view', 'station-frame.text-view', 'station-frame.reacts'],
  },
  {
    id: 'docked-always-inert',
    file: FILE,
    find: 'inert={inWorld && !docked}',
    replace: 'inert={inWorld}',
    caseIds: ['station-frame.world-docked', 'station-frame.reacts'],
  },
  {
    id: 'docked-ignores-station',
    file: FILE,
    find: ' && state.flight.station === station',
    replace: '',
    caseIds: ['station-frame.docked-elsewhere'],
  },
  {
    id: 'docked-ignores-view',
    file: FILE,
    find: "state.view === 'world' && state.flight.mode",
    replace: 'state.flight.mode',
    caseIds: ['station-frame.text-view', 'station-frame.reacts'],
  },
  {
    id: 'docked-attribute-dropped',
    file: FILE,
    find: "data-docked={docked ? '' : undefined}",
    replace: 'data-docked={undefined}',
    caseIds: ['station-frame.world-docked', 'station-frame.reacts'],
  },
  {
    id: 'docked-attribute-always',
    file: FILE,
    find: "data-docked={docked ? '' : undefined}",
    replace: "data-docked=''",
    caseIds: [
      'station-frame.boot-view',
      'station-frame.world-hidden',
      'station-frame.docked-elsewhere',
    ],
  },
  {
    id: 'button-always',
    file: FILE,
    find: '      {inWorld ? (',
    replace: '      {true ? (',
    caseIds: ['station-frame.boot-view', 'station-frame.text-view', 'station-frame.reacts'],
  },
  {
    id: 'button-never',
    file: FILE,
    find: '      {inWorld ? (',
    replace: '      {false ? (',
    caseIds: [
      'station-frame.world-hidden',
      'station-frame.take-off-dispatch',
      'station-frame.take-off-keyboard',
      'station-frame.key-hint',
    ],
  },
  {
    id: 'never-dispatches',
    file: FILE,
    find: "    worldStore.dispatch({ type: 'take-off' });\n",
    replace: '',
    caseIds: ['station-frame.take-off-dispatch', 'station-frame.take-off-keyboard'],
  },
  {
    id: 'dispatches-autopilot',
    file: FILE,
    find: "{ type: 'take-off' }",
    replace: "{ type: 'boost', held: true }",
    caseIds: ['station-frame.take-off-dispatch', 'station-frame.take-off-keyboard'],
  },
  {
    id: 'dispatches-twice',
    file: FILE,
    find: "    worldStore.dispatch({ type: 'take-off' });\n",
    replace:
      "    worldStore.dispatch({ type: 'take-off' });\n    worldStore.dispatch({ type: 'take-off' });\n",
    caseIds: ['station-frame.take-off-dispatch'],
  },
  {
    id: 'hint-readable',
    file: FILE,
    find: '<span aria-hidden="true" className="ml-1 coarse:hidden">',
    replace: '<span className="ml-1 coarse:hidden">',
    caseIds: ['station-frame.key-hint'],
  },
  {
    id: 'hint-shown-on-touch',
    file: FILE,
    find: 'className="ml-1 coarse:hidden"',
    replace: 'className="ml-1"',
    caseIds: ['station-frame.key-hint'],
  },
  {
    id: 'hint-key-fixed',
    file: FILE,
    find: '({takeOff.keyHint})',
    replace: '(Enter)',
    caseIds: ['station-frame.key-hint'],
  },
  {
    id: 'label-dropped',
    file: FILE,
    find: '<span>{takeOff.label}</span>',
    replace: '',
    caseIds: ['station-frame.take-off-dispatch', 'station-frame.key-hint'],
  },
  {
    id: 'children-dropped',
    file: FILE,
    find: '      {children}\n',
    replace: '',
    caseIds: ['station-frame.contract'],
  },
  {
    id: 'touch-target-dropped',
    file: FILE,
    find: ' coarse:h-11 coarse:min-w-11',
    replace: '',
    caseIds: ['station-frame.touch-target'],
  },
];
