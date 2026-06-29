import type { IUniform, Texture } from 'three'
import { Vector2 } from 'three'

/**
 * Schwarzschild black-hole real-time approximation.
 * Each fragment integrates a null-ray spatial projection and intersects a thin accretion disk.
 * The critical impact parameter is b_c = 3√3 Rs / 2 and the disk starts at ISCO = 3 Rs.
 */
export const physicalBlackHoleVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const physicalBlackHoleFragmentShader = /* glsl */ `
#define PI 3.1415926538
#define MAX_STEPS 96
precision highp float;

uniform sampler2D uSpaceTexture;
uniform vec2 uBlackHolePosition;
uniform vec2 uDiskDirection;
uniform float uAspect;
uniform float uShadowRadius;
uniform float uObserverElevation;
uniform float uObserverAzimuth;
uniform float uTime;

varying vec2 vUv;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amplitude = 0.55;
  for (int octave = 0; octave < 4; octave++) {
    sum += amplitude * valueNoise(p);
    p = p * 2.07 + vec2(13.1, 7.7);
    amplitude *= 0.5;
  }
  return sum;
}

vec3 diskEmission(vec3 hit, vec3 backwardRay, out float opacity) {
  float radius = length(hit.xz);
  float inverseRadius = 1.0 / max(radius, 0.001);

  // Thin disk temperature: T^4 proportional to u^3 (1 - sqrt(3u)), with ISCO = 3 Rs.
  float flux = inverseRadius * inverseRadius * inverseRadius * max(1.0 - sqrt(3.0 * inverseRadius), 0.0);
  float temperature = pow(max(flux * 155.0, 0.0), 0.25);

  float angle = atan(hit.z, hit.x) - uObserverAzimuth;
  float orbitalSpeed = sqrt(0.5 / max(radius - 1.0, 1.0)) * 0.72;
  vec3 tangent = normalize(vec3(-hit.z, 0.0, hit.x));
  float lineOfSight = dot(tangent, -backwardRay);
  float gamma = inversesqrt(max(1.0 - orbitalSpeed * orbitalSpeed, 0.15));
  float doppler = 1.0 / max(gamma * (1.0 - orbitalSpeed * lineOfSight), 0.24);
  float gravitationalShift = sqrt(max(1.0 - inverseRadius, 0.0));
  float frequencyShift = clamp(doppler * gravitationalShift, 0.65, 1.50);

  float angularVelocity = 0.16 + 1.35 * pow(inverseRadius, 1.5);
  float orbitalPhase = angle - uTime * angularVelocity;
  vec2 flowUv = vec2(orbitalPhase * 3.2, radius * 1.45);
  float broad = fbm(flowUv);
  float fine = valueNoise(flowUv * vec2(3.7, 2.3) + 21.0);
  float filaments = 0.48 + 0.52 * sin(orbitalPhase * 28.0 - radius * 7.5 + broad * 5.0);
  float density = clamp(0.2 + broad * 0.68 + fine * 0.24 + filaments * 0.18, 0.0, 1.25);

  float innerFade = smoothstep(3.0, 3.35, radius);
  float outerFade = 1.0 - smoothstep(5.8, 6.8, radius);
  opacity = density * innerFade * outerFade * 0.62;

  vec3 amber = vec3(1.0, 0.29, 0.035);
  vec3 gold = vec3(1.0, 0.69, 0.18);
  vec3 whiteHot = vec3(1.0, 0.95, 0.76);
  vec3 color = mix(amber, gold, smoothstep(0.38, 0.82, temperature));
  color = mix(color, whiteHot, smoothstep(0.78, 1.16, temperature * frequencyShift));

  // I_nu / nu^3 is Lorentz invariant; retain the cubic beaming law, then compress it
  // for a display where the receding side remains readable.
  float physicalBeaming = frequencyShift * frequencyShift * frequencyShift;
  float beaming = mix(1.0, physicalBeaming, 0.48);
  return color * density * temperature * beaming * 2.25;
}

void main() {
  vec2 metric = (vUv - uBlackHolePosition) * vec2(uAspect, 1.0);
  vec2 diskAxis = normalize(uDiskDirection + vec2(1e-5, 0.0));
  vec2 diskPerp = vec2(-diskAxis.y, diskAxis.x);
  vec2 local = vec2(dot(metric, diskAxis), dot(metric, diskPerp));
  float screenRadius = length(local) / max(uShadowRadius, 1e-4);

  vec3 originalBackground = texture2D(uSpaceTexture, vUv).rgb;
  if (screenRadius > 4.05) {
    gl_FragColor = vec4(originalBackground, 1.0);
    return;
  }

  // 2.598 = 3√3/2, mapping the visible shadow edge to the critical impact parameter.
  // A near edge-on observer keeps the direct disk thin while lensing the far side
  // into the characteristic bright arcs above and below the shadow.
  const float observerRadius = 8.0;
  vec3 rayPosition = vec3(0.0, sin(uObserverElevation) * observerRadius, cos(uObserverElevation) * observerRadius);
  vec3 cameraForward = normalize(-rayPosition);
  vec3 cameraRight = vec3(1.0, 0.0, 0.0);
  vec3 cameraUp = normalize(cross(cameraRight, cameraForward));
  float angularScale = 2.598076211 / length(rayPosition);
  vec3 rayDirection = normalize(cameraForward + cameraRight * (local.x / uShadowRadius) * angularScale + cameraUp * (local.y / uShadowRadius) * angularScale);
  vec3 initialDirection = rayDirection;

  float angularMomentum2 = dot(cross(rayPosition, rayDirection), cross(rayPosition, rayDirection));
  float minimumRadius = length(rayPosition);
  float diskAlpha = 0.0;
  vec3 diskColor = vec3(0.0);
  bool captured = false;
  bool escaped = false;

  for (int stepIndex = 0; stepIndex < MAX_STEPS; stepIndex++) {
    float radius = length(rayPosition);
    minimumRadius = min(minimumRadius, radius);
    if (radius < 1.0) {
      captured = true;
      break;
    }
    if (stepIndex > 12 && radius > 9.5 && dot(rayPosition, rayDirection) > 0.0) {
      escaped = true;
      break;
    }

    float dt = clamp((radius - 0.82) * 0.052, 0.024, 0.22);
    vec3 previousPosition = rayPosition;

    // Cartesian form corresponding to u'' + u = 3u^2/2 in Schwarzschild units Rs = 1.
    vec3 gravity = -1.5 * angularMomentum2 * rayPosition / max(pow(radius, 5.0), 1e-4);
    rayDirection = normalize(rayDirection + gravity * dt);
    rayPosition += rayDirection * dt;

    // Curved rays can cross the disk twice, producing primary and secondary lensed images.
    if (previousPosition.y * rayPosition.y <= 0.0 && diskAlpha < 0.94) {
      float crossing = previousPosition.y / (previousPosition.y - rayPosition.y);
      vec3 hit = mix(previousPosition, rayPosition, clamp(crossing, 0.0, 1.0));
      float diskRadius = length(hit.xz);
      if (diskRadius >= 3.0 && diskRadius <= 6.8) {
        float sampleAlpha;
        vec3 sampleColor = diskEmission(hit, rayDirection, sampleAlpha);
        float lensingGain = 1.0 + 0.48 * exp(-pow((minimumRadius - 1.5) / 0.42, 2.0));
        sampleColor *= lensingGain;
        diskColor += (1.0 - diskAlpha) * sampleColor * sampleAlpha;
        diskAlpha += (1.0 - diskAlpha) * sampleAlpha;
      }
    }
  }

  float forwardProjection = dot(rayDirection, cameraForward);
  vec2 escapedLocal = local;
  if (escaped && forwardProjection > 0.08) {
    escapedLocal = vec2(dot(rayDirection, cameraRight), dot(rayDirection, cameraUp));
    escapedLocal /= forwardProjection * angularScale;
    escapedLocal *= uShadowRadius;
  } else if (!captured) {
    vec2 directionDelta = vec2(dot(rayDirection - initialDirection, cameraRight), dot(rayDirection - initialDirection, cameraUp));
    escapedLocal += directionDelta * uShadowRadius * 2.2;
  }

  vec2 escapedMetric = diskAxis * escapedLocal.x + diskPerp * escapedLocal.y;
  vec2 backgroundUv = uBlackHolePosition + escapedMetric / vec2(uAspect, 1.0);
  vec3 warpedBackground = texture2D(uSpaceTexture, clamp(backgroundUv, vec2(0.001), vec2(0.999))).rgb;
  float lensBlend = 1.0 - smoothstep(1.55, 2.65, screenRadius);
  vec3 background = mix(originalBackground, warpedBackground, lensBlend);
  if (captured) background = vec3(0.0);

  // Nearly trapped rays accumulate close to the r = 1.5 Rs photon sphere.
  float photonOrbit = exp(-pow((minimumRadius - 1.5) / 0.105, 2.0));
  float ringVisibility = photonOrbit * (0.08 + diskAlpha * 0.52);
  vec3 photonColor = vec3(1.18, 0.82, 0.34) * ringVisibility * 1.28;

  vec3 color = background * (1.0 - diskAlpha) + diskColor + photonColor;
  float softBloom = max(max(diskColor.r, diskColor.g), diskColor.b);
  color += vec3(1.0, 0.54, 0.12) * softBloom * 0.065;
  float edgeBlend = 1.0 - smoothstep(3.55, 4.05, screenRadius);
  color = mix(originalBackground, color, edgeBlend);
  gl_FragColor = vec4(color, 1.0);
}
`

export interface PhysicalBlackHoleUniforms {
  [uniform: string]: IUniform<unknown>
  uSpaceTexture: { value: Texture | null }
  uBlackHolePosition: { value: Vector2 }
  uDiskDirection: { value: Vector2 }
  uAspect: { value: number }
  uShadowRadius: { value: number }
  uObserverElevation: { value: number }
  uObserverAzimuth: { value: number }
  uTime: { value: number }
}

export function createPhysicalBlackHoleUniforms(): PhysicalBlackHoleUniforms {
  return {
    uSpaceTexture: { value: null },
    uBlackHolePosition: { value: new Vector2(0.5, 0.5) },
    uDiskDirection: { value: new Vector2(1.0, 0.0) },
    uAspect: { value: 1.0 },
    uShadowRadius: { value: 0.066 },
    uObserverElevation: { value: 0.13 },
    uObserverAzimuth: { value: 0 },
    uTime: { value: 0 },
  }
}