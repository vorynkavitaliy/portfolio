export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const clamp01 = (value: number): number => {
  return clamp(value, 0, 1);
};

export const wrapAngle = (angle: number): number => {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
};

export const response = (dt: number, rate: number): number => {
  return 1 - Math.exp(-dt * rate);
};

export const horizontalDistance = (ax: number, az: number, bx: number, bz: number): number => {
  return Math.hypot(ax - bx, az - bz);
};
