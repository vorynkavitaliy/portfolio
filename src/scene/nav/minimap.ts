import { MAP_HALF, MAP_SIZE } from '@/scene/world/world.constants';

export const MAP_PICK_RADIUS = 14;

const REFERENCE_SIZE = 160;
const COLOR_VISITED = '#ffaa00';
const COLOR_PENDING = '#ffffff';
const COLOR_CORE = '#000000';
const COLOR_PLANE = '#ff5a5a';
const MARKER_HALF = 3;
const CORE_HALF = 1;
const PLANE_NOSE = 8;
const PLANE_TAIL = 5;

export type MinimapStation = Readonly<{ x: number; z: number; lit: boolean }>;

export type MinimapPlane = Readonly<{ x: number; z: number; yaw: number }>;

export type MinimapFrame = Readonly<{
  image: Uint8ClampedArray;
  size: number;
  stations: readonly MinimapStation[];
  plane: MinimapPlane | null;
}>;

export const stationAtMap = (
  u: number,
  v: number,
  stations: readonly Readonly<{ x: number; z: number }>[],
): number | null => {
  const x = u * MAP_SIZE - MAP_HALF;
  const z = v * MAP_SIZE - MAP_HALF;
  let best: number | null = null;
  let bestDistance = MAP_PICK_RADIUS;

  for (let index = 0; index < stations.length; index += 1) {
    const station = stations[index];

    if (station === undefined) {
      continue;
    }

    const distance = Math.hypot(station.x - x, station.z - z);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }

  return best;
};

const toPixel = (world: number, size: number): number => {
  return ((world + MAP_HALF) / MAP_SIZE) * size;
};

const drawStations = (
  context: CanvasRenderingContext2D,
  frame: MinimapFrame,
  scale: number,
): void => {
  const marker = MARKER_HALF * scale;
  const core = CORE_HALF * scale;

  for (const station of frame.stations) {
    const x = toPixel(station.x, frame.size);
    const z = toPixel(station.z, frame.size);

    context.fillStyle = station.lit ? COLOR_VISITED : COLOR_PENDING;
    context.fillRect(x - marker, z - marker, marker * 2, marker * 2);
    context.fillStyle = COLOR_CORE;
    context.fillRect(x - core, z - core, core * 2, core * 2);
  }
};

const drawPlane = (
  context: CanvasRenderingContext2D,
  plane: MinimapPlane,
  size: number,
  scale: number,
): void => {
  const x = toPixel(plane.x, size);
  const z = toPixel(plane.z, size);
  const dx = Math.sin(plane.yaw);
  const dz = Math.cos(plane.yaw);
  const nose = PLANE_NOSE * scale;
  const tail = PLANE_TAIL * scale;

  context.fillStyle = COLOR_PLANE;
  context.beginPath();
  context.moveTo(x + dx * nose, z + dz * nose);
  context.lineTo(x - dx * tail + dz * tail, z - dz * tail - dx * tail);
  context.lineTo(x - dx * tail - dz * tail, z - dz * tail + dx * tail);
  context.closePath();
  context.fill();
};

const imageCache = new WeakMap<HTMLCanvasElement, ImageData>();

const imageFor = (canvas: HTMLCanvasElement, frame: MinimapFrame): ImageData => {
  let image = imageCache.get(canvas);

  if (image === undefined || image.width !== frame.size) {
    image = new ImageData(frame.size, frame.size);
    imageCache.set(canvas, image);
  }

  image.data.set(frame.image);

  return image;
};

export const drawMinimap = (canvas: HTMLCanvasElement, frame: MinimapFrame): void => {
  const context = canvas.getContext('2d');

  if (context === null) {
    return;
  }

  if (canvas.width !== frame.size || canvas.height !== frame.size) {
    canvas.width = frame.size;
    canvas.height = frame.size;
  }

  const scale = frame.size / REFERENCE_SIZE;

  context.putImageData(imageFor(canvas, frame), 0, 0);
  drawStations(context, frame, scale);

  const { plane } = frame;

  if (plane !== null && Number.isFinite(plane.x + plane.z + plane.yaw)) {
    drawPlane(context, plane, frame.size, scale);
  }
};
