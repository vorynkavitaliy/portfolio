import { Vector3, type PerspectiveCamera } from 'three';

import { cameraFloor } from '@/scene/flight/camera';
import { CRUISE_SPEED, HOME_STATION } from '@/scene/flight/flight.constants';
import {
  CAMERA_BACK,
  CAMERA_LOOK_RATE,
  CAMERA_POS_RATE,
  CAMERA_UP,
  FOV_EPSILON,
  FOV_KICK,
  FOV_RESPONSE,
  INTRO_FROM,
  INTRO_LOOK_LIFT,
  LOOK_AHEAD,
  LOOK_LIFT,
  LOOK_STATION_BLEND,
  NARROW_MAX_WIDTH,
  NAV_BLEND_RATE,
  VIEW_OFFSET,
} from '@/scene/runtime/runtime.constants';

import type { PlaneState, Terrain, Vec3 } from '@/scene/flight/flight.types';

export type ViewOffset = Readonly<{ x: number; y: number }>;

export type RigFrame = Readonly<{
  plane: Readonly<PlaneState>;
  dt: number;
  focusIndex: number;
  intro: Readonly<{ progress: number; done: boolean }>;
  shake: number;
}>;

export type CameraRig = Readonly<{
  update: (frame: RigFrame) => void;
  snap: (plane: Readonly<PlaneState>, focusIndex: number) => void;
  showIntroStart: (plane: Readonly<PlaneState>) => void;
}>;

export type CameraRigOptions = Readonly<{
  camera: PerspectiveCamera;
  stations: readonly Readonly<Vec3>[];
  terrain: Terrain;
  reducedMotion: boolean;
}>;

export const easeInOut = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const followFactor = (dt: number, rate: number): number => {
  return 1 - Math.exp(-dt * rate);
};

export const fovKickTarget = (speed: number, reducedMotion: boolean): number => {
  if (reducedMotion) {
    return 0;
  }

  return Math.min(1, Math.max(0, (speed - CRUISE_SPEED) / CRUISE_SPEED)) * FOV_KICK;
};

export const viewOffsetFor = (width: number, height: number): ViewOffset => {
  if (width <= NARROW_MAX_WIDTH) {
    return { x: 0, y: VIEW_OFFSET * height };
  }

  return { x: -VIEW_OFFSET * width, y: 0 };
};

export const applyViewport = (camera: PerspectiveCamera, width: number, height: number): void => {
  const offset = viewOffsetFor(width, height);

  camera.aspect = width / height;
  camera.setViewOffset(width, height, offset.x, offset.y, width, height);
  camera.updateProjectionMatrix();
};

export const createCameraRig = (options: CameraRigOptions): CameraRig => {
  const { camera, stations, terrain, reducedMotion } = options;
  const home: Readonly<Vec3> = stations[HOME_STATION] ?? { x: 0, y: 0, z: 0 };
  const positionRate = reducedMotion ? CAMERA_POS_RATE.reduced : CAMERA_POS_RATE.normal;
  const lookRate = reducedMotion ? CAMERA_LOOK_RATE.reduced : CAMERA_LOOK_RATE.normal;
  const baseFov = camera.fov;

  const introFrom = new Vector3(
    home.x + INTRO_FROM.x,
    home.y + INTRO_FROM.y,
    home.z + INTRO_FROM.z,
  );

  const homeLook = new Vector3(home.x, home.y + INTRO_LOOK_LIFT, home.z);
  const camBase = new Vector3();
  const lookBase = new Vector3();
  const flat = new Vector3();
  const desired = new Vector3();
  const look = new Vector3();
  const lookStation = new Vector3();
  const position = new Vector3();
  const target = new Vector3();
  let blend = 0;
  let lastFocus = HOME_STATION;
  let fovKick = 0;

  const chase = (plane: Readonly<PlaneState>, dt: number, snap: boolean): void => {
    const pitchCos = Math.cos(plane.pitch);
    const focus = stations[lastFocus] ?? home;

    flat.set(Math.sin(plane.yaw), 0, Math.cos(plane.yaw));
    desired.set(plane.pos.x, plane.pos.y, plane.pos.z).addScaledVector(flat, -CAMERA_BACK);
    desired.y += CAMERA_UP;

    look
      .set(flat.x * pitchCos, Math.sin(plane.pitch), flat.z * pitchCos)
      .multiplyScalar(LOOK_AHEAD);

    look.x += plane.pos.x;
    look.y += plane.pos.y;
    look.z += plane.pos.z;

    lookStation.set(
      focus.x,
      focus.y + (lastFocus === HOME_STATION ? LOOK_LIFT.home : LOOK_LIFT.station),
      focus.z,
    );

    look.lerp(lookStation, LOOK_STATION_BLEND * blend);
    camBase.lerp(desired, snap ? 1 : followFactor(dt, positionRate));
    lookBase.lerp(look, snap ? 1 : followFactor(dt, lookRate));
  };

  const place = (): void => {
    const floor = cameraFloor(position.x, position.z, terrain);

    if (position.y < floor) {
      position.y = floor;
    }

    camera.position.copy(position);
    camera.lookAt(target);
    camera.updateMatrixWorld();
  };

  const focusOn = (focusIndex: number): void => {
    if (focusIndex >= 0) {
      lastFocus = focusIndex;
    }
  };

  const update = (frame: RigFrame): void => {
    const { plane, dt } = frame;

    focusOn(frame.focusIndex);
    blend += ((frame.focusIndex >= 0 ? 1 : 0) - blend) * followFactor(dt, NAV_BLEND_RATE);
    chase(plane, dt, false);
    position.copy(camBase);
    target.copy(lookBase);

    if (!frame.intro.done) {
      const eased = easeInOut(frame.intro.progress);

      position.lerpVectors(introFrom, camBase, eased);
      target.lerpVectors(homeLook, lookBase, eased);
    }

    if (frame.shake > 0) {
      position.x += (Math.random() - 0.5) * frame.shake;
      position.y += (Math.random() - 0.5) * frame.shake;
    }

    place();

    fovKick +=
      (fovKickTarget(plane.speed, reducedMotion) - fovKick) * followFactor(dt, FOV_RESPONSE);

    if (Math.abs(camera.fov - (baseFov + fovKick)) > FOV_EPSILON) {
      camera.fov = baseFov + fovKick;
      camera.updateProjectionMatrix();
    }
  };

  const snap = (plane: Readonly<PlaneState>, focusIndex: number): void => {
    focusOn(focusIndex);
    blend = focusIndex >= 0 ? 1 : 0;
    chase(plane, 0, true);
    position.copy(camBase);
    target.copy(lookBase);
    place();
  };

  const showIntroStart = (plane: Readonly<PlaneState>): void => {
    snap(plane, HOME_STATION);

    if (reducedMotion) {
      return;
    }

    position.copy(introFrom);
    target.copy(homeLook);
    place();
  };

  return { update, snap, showIntroStart };
};
