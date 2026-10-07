export const SKY_VERTEX = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SKY_FRAGMENT = `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uMoon;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, 0.0, 1.0);
  vec3 c = mix(uHorizon, uTop, pow(h, 0.45));
  float m = max(dot(vDir, uMoon), 0.0);
  c += vec3(0.22, 0.25, 0.4) * pow(m, 18.0);
  gl_FragColor = vec4(c, 1.0);
}
`;

export const FIREFLY_VERTEX = `
attribute float aSeed;
uniform float uTime;
uniform float uScale;
varying float vA;
void main() {
  vec3 p = position;
  p.y += sin(uTime * 0.7 + aSeed * 40.0) * 0.6;
  p.x += sin(uTime * 0.4 + aSeed * 90.0) * 0.9;
  p.z += cos(uTime * 0.5 + aSeed * 70.0) * 0.9;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = pow(0.5 + 0.5 * sin(uTime * 2.2 + aSeed * 120.0), 3.0);
  gl_PointSize = 0.09 * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

export const FIREFLY_FRAGMENT = `
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = vA * smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vec3(2.0, 1.6, 0.6) * a, a);
}
`;
