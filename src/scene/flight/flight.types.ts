export type Vec3 = { x: number; y: number; z: number };

export type PlaneState = {
  pos: Vec3;
  yaw: number;
  pitch: number;
  roll: number;
  speed: number;
  turn: number;
};

export type Terrain = Readonly<{
  heightAt: (x: number, z: number) => number;
  seaLevel: number;
  half: number;
}>;

export type StickState = Readonly<{ active: boolean; dx: number; dy: number }>;

export type SteerTarget = { turn: number; climb: number; magnitude: number; boost: boolean };

export type Steer = Readonly<SteerTarget>;

export type FlightControl = { turn: number; climb: number; speed: number };

export type FlightMode =
  | { kind: 'intro' }
  | { kind: 'free' }
  | { kind: 'autopilot'; target: number }
  | { kind: 'docked'; station: number; dock: Vec3 };

export type DockingState = {
  mode: FlightMode;
  orbitSide: 1 | -1;
  cooldown: number;
  visited: number;
  introDone: boolean;
};

export type DockingEvent =
  | { type: 'docked'; station: number; firstVisit: boolean }
  | { type: 'undocked'; station: number }
  | { type: 'autopilot-started'; station: number }
  | { type: 'autopilot-cancelled' }
  | { type: 'reset' };

export type DockingCommand =
  { type: 'intro-done' } | { type: 'take-off' } | { type: 'autopilot'; station: number };

export type StepOutcome = 'ok' | 'reset';
