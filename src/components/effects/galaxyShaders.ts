import type { IUniform, Texture } from 'three'
import { Vector2 } from 'three'

/**
 * 黑洞引力透镜合成着色器
 * 移植自 黑洞实现js.txt 的最终合成 pass（I_ / getRGBShiftedColor）
 * 把空间场景 FBO 纹理按黑洞屏幕位置做径向引力扭曲 + RGB 色散采样
 */
export const compositeVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const compositeFragmentShader = /* glsl */ `
#define PI 3.1415926538
precision highp float;

uniform sampler2D uSpaceTexture;
uniform vec2 uBlackHolePosition;
uniform float uRGBShiftRadius;
uniform float uLensRadius;
uniform float uHorizonRadius;
uniform float uTime;

varying vec2 vUv;

float inverseLerp(float v, float lo, float hi) {
  return (v - lo) / (hi - lo);
}
float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  return mix(outMin, outMax, inverseLerp(v, inMin, inMax));
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise2d(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm2d(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise2d(p);
    p *= 2.07;
    a *= 0.5;
  }
  return v;
}

vec3 getRGBShiftedColor(sampler2D tex, vec2 uv, float radius) {
  float a1 = PI * 2.0 / 3.0;
  float a2 = PI * 4.0 / 3.0;
  vec3 color;
  color.r = texture2D(tex, uv + vec2(sin(a1), cos(a1)) * radius).r;
  color.g = texture2D(tex, uv + vec2(sin(a2), cos(a2)) * radius).g;
  color.b = texture2D(tex, uv).b;
  return color;
}

void main() {
  vec2 towardCenter = vUv - uBlackHolePosition;
  float dist = length(towardCenter);

  // 径向引力强度：黑洞中心 1.0，透镜边缘 0.0
  float radialStrength = remap(dist, 0.0, uLensRadius, 1.0, 0.0);
  radialStrength = smoothstep(0.0, 1.0, radialStrength);

  // 叠加 FBM 有机扰动，避免完美对称的廉价感
  float organic = fbm2d(vUv * 7.0 + uTime * 0.03);
  float distortionIntensity = radialStrength * (0.55 + 0.7 * organic);

  // UV 拉向黑洞（参考：towardCenter *= -distortionIntensity * 2.0）
  vec2 warped = towardCenter * (-distortionIntensity * 1.8);
  vec2 distortedUv = vUv + warped;

  vec3 outColor = getRGBShiftedColor(uSpaceTexture, distortedUv, uRGBShiftRadius * radialStrength);

  // 事件视界：中心强制纯黑
  float horizonMask = smoothstep(0.0, uHorizonRadius, dist);
  outColor *= horizonMask;

  gl_FragColor = vec4(outColor, 1.0);
}
`

export interface CompositeUniforms {
  [uniform: string]: IUniform<unknown>
  uSpaceTexture: { value: Texture | null }
  uBlackHolePosition: { value: Vector2 }
  uRGBShiftRadius: { value: number }
  uLensRadius: { value: number }
  uHorizonRadius: { value: number }
  uTime: { value: number }
}

export function createCompositeUniforms(): CompositeUniforms {
  return {
    uSpaceTexture: { value: null },
    uBlackHolePosition: { value: new Vector2(0.5, 0.5) },
    uRGBShiftRadius: { value: 0.004 },
    uLensRadius: { value: 0.17 },
    uHorizonRadius: { value: 0.045 },
    uTime: { value: 0 },
  }
}

/* ------------------------------------------------------------------ */
/* 引力透镜弧 — 远侧吸积盘被弯折后形成的上下动态光带             */
/* ------------------------------------------------------------------ */

export const lensedArcVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const lensedArcFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBrightness;
uniform float uFlowSpeed;
uniform sampler2D uNoiseTexture;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;

varying vec2 vUv;

void main() {
  float flow = uTime * uFlowSpeed;
  float broadNoise = texture2D(uNoiseTexture, vec2(fract(vUv.x * 3.2 + flow), fract(vUv.y * 1.7))).r;
  float fineNoise = texture2D(uNoiseTexture, vec2(fract(vUv.x * 11.0 - flow * 1.8), fract(vUv.y * 4.0 + 0.37))).r;
  float endpointFade = smoothstep(0.0, 0.07, vUv.x) * (1.0 - smoothstep(0.93, 1.0, vUv.x));
  float tubeGlow = 0.64 + 0.36 * pow(abs(sin(3.1415926538 * vUv.y)), 0.62);
  float pulse = 0.86 + 0.14 * sin(uTime * 1.7 + vUv.x * 24.0);
  float filament = 0.28 + broadNoise * 0.52 + fineNoise * 0.34;
  float intensity = endpointFade * tubeGlow * pulse * filament * uBrightness;

  vec3 color = mix(uOuterColor, uInnerColor, smoothstep(0.3, 0.92, broadNoise));
  color += uInnerColor * pow(max(fineNoise - 0.72, 0.0), 2.0) * 2.4;

  gl_FragColor = vec4(color * intensity, intensity);
}
`
/* ------------------------------------------------------------------ */
/* 吸积盘着色器 — 移植自参考文件 G_（3 环迭代 + 噪声调制 + blendAdd） */
/* ------------------------------------------------------------------ */

export const accretionVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const accretionFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform sampler2D uNoiseTexture;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;

varying vec2 vUv;
uniform float uBrightness;

float inverseLerp(float v, float lo, float hi) {
  return (v - lo) / (hi - lo);
}
float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  return mix(outMin, outMax, inverseLerp(v, inMin, inMax));
}
vec3 blendAdd(vec3 base, vec3 blend) {
  return min(base + blend, vec3(1.0));
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec4 color = vec4(0.0);
  color.a = 1.0;

  float iterations = 3.0;
  for (float i = 0.0; i < 3.0; i++) {
    float progress = i / (iterations - 1.0);

    float intensity = 1.0 - ((vUv.y - progress) * iterations) * 0.5;
    intensity = smoothstep(0.0, 1.0, intensity);

    vec2 uv = vUv;
    uv.y *= 2.0;
    uv.x += uTime / ((i * 10.0) + 1.0);

    float noiseIntensity = texture2D(uNoiseTexture, fract(uv)).r;

    vec3 ringColor = mix(uInnerColor, uOuterColor, progress);
    ringColor = mix(vec3(0.0), ringColor, noiseIntensity * intensity);

    color.rgb = blendAdd(color.rgb, ringColor);
  }

  float edgesAttenuation = min(inverseLerp(vUv.y, 0.0, 0.02), inverseLerp(vUv.y, 1.0, 0.5));
  color.rgb = mix(vec3(0.0), color.rgb, edgesAttenuation) * uBrightness;

  gl_FragColor = color;
}
`

/* ------------------------------------------------------------------ */
/* 坠入粒子着色器 — 移植自参考文件 W_ / j_（轨道顶点 + 圆点片元）      */
/* ------------------------------------------------------------------ */

export const infallVertexShader = /* glsl */ `
#define PI 3.1415926538

uniform float uTime;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform float uViewHeight;
uniform float uSize;
uniform float uInnerRadius;
uniform float uOuterRadius;

attribute float aProgress;
attribute float aSize;
attribute float aRandom;

varying vec3 vColor;

void main() {
  float concentration = 0.05;
  float outerProgress = smoothstep(0.0, 1.0, aProgress);
  outerProgress = mix(concentration, outerProgress, pow(aRandom, 1.7));
  float radius = uInnerRadius + outerProgress * (uOuterRadius - uInnerRadius);

  float angle = outerProgress - uTime * (1.0 - outerProgress) * 3.0;
  vec3 newPosition = vec3(sin(angle) * radius, 0.0, cos(angle) * radius);

  vec4 modelViewPosition = modelViewMatrix * vec4(newPosition, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;

  gl_PointSize = aSize * uSize * uViewHeight;
  gl_PointSize *= (1.0 / -modelViewPosition.z);

  vColor = mix(uInnerColor, uOuterColor, outerProgress);
}
`

export const infallFragmentShader = /* glsl */ `
precision highp float;
varying vec3 vColor;

void main() {
  float distanceToCenter = length(gl_PointCoord - vec2(0.5));
  if (distanceToCenter > 0.5) discard;
  gl_FragColor = vec4(vColor, 0.32);
}
`

/* ------------------------------------------------------------------ */
/* 星场着色器 — 在原 starVertex/Fragment 基础上加 FBM 空间扭曲         */
/* ------------------------------------------------------------------ */

export const starVertexShader = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute float aOrbitSpeed;
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
varying float vStar;
varying float vLayer;
varying vec2 vDragDir;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p *= 2.07;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 pos = position;
  float t = uTime * aOrbitSpeed * uMotion + aPhase;
  float cs = cos(t * 0.06);
  float sn = sin(t * 0.06);
  pos.xz = mat2(cs, -sn, sn, cs) * pos.xz;
  pos.y += sin(t * 0.5 + position.x * 0.035) * 0.12 * uMotion;

  // FBM 空间扭曲：越靠近黑洞扭曲越强，替代生硬的螺旋星臂
  float distToCenter = length(pos.xz);
  float warpFactor = smoothstep(12.0, 1.5, distToCenter) * uWarpStrength;
  float warpX = fbm(vec2(pos.x * 0.16, pos.z * 0.16) + uTime * 0.02);
  float warpZ = fbm(vec2(pos.x * 0.16 + 100.0, pos.z * 0.16) + uTime * 0.02);
  pos.x += (warpX - 0.5) * 3.2 * warpFactor;
  pos.z += (warpZ - 0.5) * 3.2 * warpFactor;
  pos.y += (warpX - 0.5) * 0.8 * warpFactor;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float depth = max(-mvPosition.z, 1.0);
  float twinkle = 0.7 + 0.3 * sin(uTime * 1.8 + aPhase);
  vColor = aColor;
  vAlpha = twinkle;
  vStar = smoothstep(0.72, 1.0, twinkle);
  vLayer = aLayer;

  vec2 screenDir = normalize(uDragDirection + vec2(0.0001));
  vDragDir = screenDir;

  float baseSize = aSize * (480.0 / depth) * uPixelRatio;
  float stretch = 1.0 + uDragIntensity * (1.5 + aLayer * 2.5);
  gl_PointSize = clamp(baseSize * mix(1.0, stretch, uDragIntensity), 0.6, 22.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const starFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
varying float vStar;
varying float vLayer;
varying vec2 vDragDir;
uniform float uDragIntensity;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);

  float dragStrength = uDragIntensity * (0.6 + vLayer * 0.8);
  vec2 stretchAxis = normalize(vDragDir + vec2(0.0001, 0.0002));
  float proj = dot(coord, stretchAxis);
  float perp = dot(coord, vec2(-stretchAxis.y, stretchAxis.x));
  float stretchFactor = 1.0 + dragStrength * 6.0;
  float stretchedDist = sqrt((proj * proj) / (stretchFactor * stretchFactor) + perp * perp);

  float dist = length(coord);
  float effectiveDist = mix(dist, stretchedDist, dragStrength);

  if (effectiveDist > 0.5) discard;

  float core = 1.0 - smoothstep(0.0, 0.1, effectiveDist);
  float glow = pow(1.0 - smoothstep(0.03, 0.5, effectiveDist), 2.0);
  float softGlow = pow(1.0 - smoothstep(0.1, 0.5, effectiveDist), 1.5) * 0.5;

  vec2 rayDir = stretchAxis;
  float rayAlong = 1.0 - smoothstep(0.004, 0.08, abs(perp));
  float rayLen = 1.0 - smoothstep(0.0, 0.5, abs(proj) * (1.0 + dragStrength * 3.0));
  float streakRay = rayAlong * rayLen * (0.3 + dragStrength * 0.9);

  float rayX = 1.0 - smoothstep(0.008, 0.07, abs(coord.x));
  float rayY = 1.0 - smoothstep(0.008, 0.07, abs(coord.y));
  float diagonalA = 1.0 - smoothstep(0.006, 0.05, abs(coord.x + coord.y));
  float diagonalB = 1.0 - smoothstep(0.006, 0.05, abs(coord.x - coord.y));
  float staticRays = max(max(rayX, rayY), max(diagonalA, diagonalB)) * (1.0 - dist * 1.5) * vStar * (1.0 - dragStrength * 0.6);

  float rays = max(staticRays, streakRay * vStar);

  vec3 warmTint = vec3(1.0, 0.93, 0.82);
  vec3 coolTint = vec3(0.85, 0.92, 1.0);
  vec3 tintedColor = vColor * mix(warmTint, coolTint, vLayer * 0.5 + 0.25);

  vec3 color = tintedColor * (glow * 1.2 + core * 1.0 + softGlow * 0.6) + warmTint * rays * 0.7;

  float trailAlpha = 0.0;
  if (dragStrength > 0.1) {
    float trailWidth = 0.02 + dragStrength * 0.06;
    float trailLen = 0.3 + dragStrength * 0.6;
    float trail = (1.0 - smoothstep(0.0, trailWidth, abs(perp))) * (1.0 - smoothstep(0.0, trailLen, abs(proj)));
    trailAlpha = trail * dragStrength * 0.5 * vStar;
  }

  float alpha = (glow * 0.75 + core * 0.15 + rays * 0.3 + softGlow * 0.25 + trailAlpha) * vAlpha;
  gl_FragColor = vec4(color, alpha);
}
`
