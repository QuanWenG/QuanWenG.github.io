export const beaconVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const beaconFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uActive;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  vec2 point = vUv - 0.5;
  float radius = length(point);
  float angle = atan(point.y, point.x);
  float ringA = 1.0 - smoothstep(0.006, 0.018, abs(radius - 0.34));
  float ringB = 1.0 - smoothstep(0.005, 0.016, abs(radius - 0.46));
  float arcA = ringA * smoothstep(0.12, 0.72, sin(angle * 1.38 - uTime * (0.1 + uActive * 0.18) + 0.45));
  float arcB = ringB * smoothstep(0.3, 0.82, cos(angle * 1.16 + uTime * (0.07 + uActive * 0.14) - 1.25));
  float orbitAngle = mod(uTime * (0.28 + uActive * 0.32), 6.2831853) - 3.1415926;
  float angularDistance = abs(atan(sin(angle - orbitAngle), cos(angle - orbitAngle)));
  float orbitSpark = exp(-angularDistance * angularDistance * 58.0) * ringB;
  float tick = (1.0 - smoothstep(0.0, 0.018, abs(sin(angle * 6.0)))) * ringA * 0.18;
  float intensity = arcA * (0.18 + uActive * 0.62)
    + arcB * (0.14 + uActive * 0.54)
    + orbitSpark * (0.8 + uActive * 1.5)
    + tick;
  if (radius > 0.5 || intensity < 0.004) discard;
  vec3 color = mix(uColor, vec3(0.96, 1.0, 0.98), orbitSpark * 0.72 + uActive * 0.12);
  gl_FragColor = vec4(color * intensity * 1.65, intensity);
}
`
