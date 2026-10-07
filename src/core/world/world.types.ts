import type { StationId } from '@/core/world/stations';

export type WorldView = 'boot' | 'world' | 'text';

export type WorldFailReason =
  'no-webgl2' | 'chunk-failed' | 'worker-failed' | 'renderer-failed' | 'context-lost' | 'timeout';

export type TextReason = 'deep-link' | 'escape' | 'no-webgl2' | 'low-end' | 'failed' | 'visitor';

export type BootState =
  | { status: 'idle' }
  | { status: 'loading'; worker: number; engine: boolean }
  | { status: 'ready' }
  | { status: 'running' }
  | { status: 'failed'; reason: WorldFailReason };

export type FlightPhase =
  | { mode: 'intro' }
  | { mode: 'free' }
  | { mode: 'autopilot'; target: StationId }
  | { mode: 'docked'; station: StationId };

export type WorldMenu = 'none' | 'autopilot' | 'map';

export type FlashKind = 'take-off' | 'send';

export type WorldSnapshot = Readonly<{
  view: WorldView;
  textReason: TextReason | null;
  worldAvailable: boolean;
  boot: BootState;
  flight: FlightPhase;
  visited: readonly StationId[];
  sound: boolean;
  inputUsed: boolean;
  menu: WorldMenu;
  slow: boolean;
  flash: Readonly<{ seq: number; kind: FlashKind }> | null;
}>;

export type WorldCommand =
  | { type: 'take-off' }
  | { type: 'autopilot'; station: StationId }
  | { type: 'boost'; held: boolean }
  | { type: 'celebrate-send' };

export type MapPoint = Readonly<{ u: number; v: number }>;

export type WorldController = Readonly<{
  handle: (command: WorldCommand) => void;
  drawMap: (canvas: HTMLCanvasElement) => void;
  stationAtMap: (point: MapPoint) => StationId | null;
}>;
