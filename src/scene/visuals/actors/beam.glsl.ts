export const BEAM_VERTEX = `
attribute float aIntensity;
varying vec2 vUv;
varying float vIntensity;
void main() {
  vUv = uv;
  vIntensity = aIntensity;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`;

export const BEAM_FRAGMENT = `
uniform vec3 uColor;
uniform float uTime;
varying vec2 vUv;
varying float vIntensity;
void main() {
  float a = pow(1.0 - vUv.y, 1.4) * (0.65 + 0.35 * sin(uTime * 2.4 - vUv.y * 40.0));
  gl_FragColor = vec4(uColor * (0.6 + vIntensity), a * clamp(vIntensity, 0.0, 2.0) * 0.5);
}
`;
