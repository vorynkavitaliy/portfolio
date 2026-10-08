import type { WorldCopy } from '@/content/content.types';

export const WORLD_COPY: WorldCopy = {
  loader: {
    name: 'VITALII VORYNKA',
    line: 'Full-stack Developer · AI Engineer. Take the controls.',
    stages: {
      generating: 'Generating world',
      engine: 'Loading engine',
      building: 'Building scene',
      ready: 'World ready',
    },
    progress: '{stage} {percent}%',
    takeOff: 'Take off',
    textLink: 'Read the text version',
  },
  header: {
    brand: 'VITALII VORYNKA',
    autopilot: 'Autopilot',
    map: 'Road map',
    toText: 'Text version',
    toWorld: '3D world',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
  },
  hud: {
    linked: 'Linked {n}/{total}',
    barLabel: 'Stations, autopilot',
    barCell: 'Autopilot to {station}',
    boost: 'Boost',
    hints: {
      keyboard:
        'Fly with WASD or arrows, or drag the mouse. Shift to boost. Enter an amber beam to connect.',
      touch: 'Drag to steer. Fly into a beam to connect.',
      dockedKeyboard: 'Docked. Read on, then press Space to take off.',
      dockedTouch: 'Docked. Tap Take off to fly on.',
    },
  },
  menus: {
    autopilotTitle: 'Autopilot to…',
    visited: 'Visited',
    mapLabel: 'Road map. Click a station to autopilot there.',
    mapCaption: 'Click a station to autopilot there.',
  },
  panel: { takeOff: 'Take off', takeOffKey: 'Space' },
  titleCard: 'Link established · {tag}',
  announceDocked: 'Docked at {station}.',
  navLabel: '{name} · {distance}m',
  notices: {
    noWebgl2: '3D is not available in this browser. Showing the text version.',
    failed: 'The 3D world did not load. Showing the text version.',
  },
  slowPrompt: {
    text: 'The world runs slowly on this device. The text version loads faster.',
    action: 'Open text version',
    dismiss: 'Keep flying',
  },
  skyName: ['VITALII', 'VORYNKA'],
};
