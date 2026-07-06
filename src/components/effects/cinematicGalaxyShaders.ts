export const cinematicStarVertexShader = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute float aOrbitSpeed;
attribute float aBrightness;
attribute vec3 aColor;
attribute float aLayer;

uniform float uTime;
uniform float uPixelRatio;
uniform float uMotion;
uniform float uDragIntensity;
uniform vec2 uDragDirection;
uniform float uWarpStrength;

varying vec3 vColor;
varying float vAlpha;
varying float vBrightness;
varying float vLayer;
varying vec2 vDragDirection;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x),
             mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}

void main() {
  vec3 positionAnimated = position;
  float phase = uTime * aOrbitSpeed * uMotion + aPhase;
  float angle = phase * (0.025 + aLayer * 0.035);
  float cs = cos(angle);
  float sn = sin(angle);
  positionAnimated.xz = mat2(cs, -sn, sn, cs) * positionAnimated.xz;

  float distanceToCenter = length(positionAnimated.xz);
  float warp = (1.0 - smoothstep(4.0, 24.0, distanceToCenter)) * uWarpStrength;
  float displacementA = noise2(positionAnimated.xz * 0.11 + uTime * 0.008);
  float displacementB = noise2(positionAnimated.zx * 0.14 - uTime * 0.006 + 31.7);
  positionAnimated.x += (displacementA - 0.5) * 2.4 * warp;
  positionAnimated.y += (displacementB - 0.5) * 0.72 * warp;
  positionAnimated.z += (displacementB - 0.5) * 2.4 * warp;

  vec4 viewPosition = modelViewMatrix * vec4(positionAnimated, 1.0);
  float depth = max(-viewPosition.z, 1.0);
  float twinkle = mix(1.0, 0.78 + 0.22 * sin(uTime * (0.7 + aBrightness) + aPhase), uMotion);
  vColor = aColor;
  vAlpha = twinkle * (0.54 + aBrightness * 0.72);
  vBrightness = aBrightness;
  vLayer = aLayer;
  vDragDirection = normalize(uDragDirection + vec2(0.0001));

  float perspectiveSize = aSize * (430.0 / depth) * uPixelRatio;
  float streak = 1.0 + uDragIntensity * (0.7 + aLayer * 2.3);
  gl_PointSize = clamp(perspectiveSize * streak, 0.55, 24.0);
  gl_Position = projectionMatrix * viewPosition;
}
`

export const cinematicStarFragmentShader = /* glsl */ `
precision highp float;

uniform float uDragIntensity;
varying vec3 vColor;
varying float vAlpha;
varying float vBrightness;
varying float vLayer;
varying vec2 vDragDirection;

void main() {
  vec2 point = gl_PointCoord - 0.5;
  vec2 axis = normalize(vDragDirection + vec2(0.0001));
  float along = dot(point, axis);
  float across = dot(point, vec2(-axis.y, axis.x));
  float drag = uDragIntensity * (0.35 + vLayer * 0.65);
  float stretchedDistance = sqrt(along * along / pow(1.0 + drag * 6.0, 2.0) + across * across);
  float distanceToCenter = mix(length(point), stretchedDistance, drag);
  if (distanceToCenter > 0.5) discard;

  float core = 1.0 - smoothstep(0.0, 0.065, distanceToCenter);
  float glow = pow(max(1.0 - distanceToCenter * 2.0, 0.0), 3.4);
  float airy = pow(max(1.0 - distanceToCenter * 1.65, 0.0), 7.0) * 0.24;
  float brightStar = smoothstep(0.975, 0.998, vBrightness);
  float rayX = 1.0 - smoothstep(0.005, 0.035, abs(point.x));
  float rayY = 1.0 - smoothstep(0.005, 0.035, abs(point.y));
  float rayFalloff = pow(max(1.0 - length(point) * 1.75, 0.0), 3.0);
  float diffraction = max(rayX, rayY) * rayFalloff * brightStar;
  float streak = (1.0 - smoothstep(0.006, 0.055, abs(across)))
    * (1.0 - smoothstep(0.08, 0.5, abs(along)))
    * drag * brightStar;

  vec3 color = vColor * (core * 1.8 + glow * 1.35 + airy);
  color += vec3(0.92, 0.97, 1.0) * (diffraction * 0.9 + streak * 1.4);
  float alpha = (core * 0.82 + glow * 0.72 + airy + diffraction * 0.46 + streak * 0.65) * vAlpha;
  gl_FragColor = vec4(color, alpha);
}
`
