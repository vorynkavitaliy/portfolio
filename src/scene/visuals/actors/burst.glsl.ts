import { BURST_COLOR, BURST_SIZE } from '@/scene/visuals/actors/actors.constants';

export const BURST_VERTEX = `
attribute vec3 aDir;
uniform float uT;
uniform vec3 uOrigin;
uniform float uScale;
varying float vAlpha;
void main() {
  float t = clamp(uT, 0.0, 1.0);
  vec3 p = uOrigin + aDir * (1.0 - pow(1.0 - t, 3.0)) * ${BURST_SIZE.travel.toFixed(1)} + vec3(0.0, -t * t * ${BURST_SIZE.drop.toFixed(1)}, 0.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (1.0 - t) * ${BURST_SIZE.scale.toFixed(2)} * uScale / -mv.z;
  vAlpha = 1.0 - t;
  gl_Position = projectionMatrix * mv;
}
`;

export const BURST_FRAGMENT = `
varying float vAlpha;
void main() {
  vec2 q = abs(gl_PointCoord - 0.5);
  if (max(q.x, q.y) > 0.5) discard;
  gl_FragColor = vec4(vec3(${BURST_COLOR[0].toFixed(1)}, ${BURST_COLOR[1].toFixed(1)}, ${BURST_COLOR[2].toFixed(2)}) * vAlpha, vAlpha);
}
`;
