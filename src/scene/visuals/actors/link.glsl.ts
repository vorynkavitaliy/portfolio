import { LINK_COLOR } from '@/scene/visuals/actors/actors.constants';

export const LINK_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const LINK_FRAGMENT = `
uniform float uTime;
uniform float uLen;
uniform float uIntensity;
varying vec2 vUv;
void main() {
  float d = step(0.5, fract(vUv.y * uLen * 0.35 - uTime * 2.2));
  float a = (0.22 + 0.78 * d) * uIntensity;
  gl_FragColor = vec4(vec3(${LINK_COLOR[0].toFixed(1)}, ${LINK_COLOR[1].toFixed(1)}, ${LINK_COLOR[2].toFixed(1)}) * a, a);
}
`;
