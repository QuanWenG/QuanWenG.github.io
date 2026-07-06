import type { IUniform, Texture } from 'three'
import { Matrix4, Vector3 } from 'three'

export const WORLD_SPACE_BLACK_HOLE_DISK_NORMAL = new Vector3(0.06, 0.998, 0.02).normalize()
export const WORLD_SPACE_BLACK_HOLE_CRITICAL_RADIUS = 2.598076211
export const WORLD_SPACE_BLACK_HOLE_OUTER_WORLD_RADIUS = 3.744
export const WORLD_SPACE_BLACK_HOLE_HORIZON_TO_DISK_RATIO = 0.235
export const WORLD_SPACE_BLACK_HOLE_DISK_INNER_TO_OUTER_RATIO = 0.38
export const WORLD_SPACE_BLACK_HOLE_DISK_INNER_SCALE_HEIGHT = 0.035
export const WORLD_SPACE_BLACK_HOLE_DISK_OUTER_SCALE_HEIGHT = 0.08
export const WORLD_SPACE_BLACK_HOLE_HORIZON_RADIUS =
  WORLD_SPACE_BLACK_HOLE_OUTER_WORLD_RADIUS * WORLD_SPACE_BLACK_HOLE_HORIZON_TO_DISK_RATIO
export const WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS =
  WORLD_SPACE_BLACK_HOLE_DISK_INNER_TO_OUTER_RATIO
  / WORLD_SPACE_BLACK_HOLE_HORIZON_TO_DISK_RATIO
export const WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS =
  1 / WORLD_SPACE_BLACK_HOLE_HORIZON_TO_DISK_RATIO
export const WORLD_SPACE_BLACK_HOLE_LENSING_MARGIN = 0.65
export const WORLD_SPACE_BLACK_HOLE_INTEGRATION_RADIUS =
  WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS + WORLD_SPACE_BLACK_HOLE_LENSING_MARGIN

export const worldSpaceKerrBlackHoleVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const worldSpaceKerrBlackHoleFragmentShader = /* glsl */ `
#define PI 3.1415926538
#define MAX_STEPS 144
precision highp float;

uniform sampler2D uSpaceTexture;
uniform sampler2D uSpaceDepth;
uniform mat4 uInverseProjectionMatrix;
uniform mat4 uCameraWorldMatrix;
uniform mat4 uViewProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec3 uBlackHoleWorldPosition;
uniform vec3 uDiskNormal;
uniform float uHorizonRadius;
uniform float uSpin;
uniform float uTime;

varying vec2 vUv;

float hash21(vec2 point) {
  point = fract(point * vec2(123.34, 456.21));
  point += dot(point, point + 45.32);
  return fract(point.x * point.y);
}

float noise2(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  local = local * local * (3.0 - 2.0 * local);
  return mix(
    mix(hash21(cell), hash21(cell + vec2(1.0, 0.0)), local.x),
    mix(hash21(cell + vec2(0.0, 1.0)), hash21(cell + vec2(1.0, 1.0)), local.x),
    local.y
  );
}

float fbm(vec2 point) {
  float value = 0.0;
  float amplitude = 0.54;
  for (int octave = 0; octave < 5; octave++) {
    value += noise2(point) * amplitude;
    point = point * mat2(1.73, -1.08, 1.08, 1.73) + vec2(7.13, 3.71);
    amplitude *= 0.47;
  }
  return value;
}

float ridgedFbm(vec2 point) {
  float value = 0.0;
  float amplitude = 0.58;
  for (int octave = 0; octave < 4; octave++) {
    float ridge = 1.0 - abs(noise2(point) * 2.0 - 1.0);
    value += ridge * ridge * amplitude;
    point = point * mat2(1.96, -0.91, 0.91, 1.96) + vec2(4.73, 9.17);
    amplitude *= 0.46;
  }
  return value;
}

void diskBasis(vec3 normal, out vec3 axisA, out vec3 axisB) {
  vec3 reference = abs(normal.y) < 0.92 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  axisA = normalize(cross(reference, normal));
  axisB = normalize(cross(normal, axisA));
}

vec3 reconstructWorldRay(vec2 uv) {
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 viewPosition = uInverseProjectionMatrix * vec4(ndc, 1.0, 1.0);
  viewPosition /= max(abs(viewPosition.w), 1e-5);
  vec3 worldPosition = (uCameraWorldMatrix * vec4(viewPosition.xyz, 1.0)).xyz;
  return normalize(worldPosition - uCameraPosition);
}

vec3 reconstructWorldPosition(vec2 uv, float depth) {
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 viewPosition = uInverseProjectionMatrix
    * vec4(ndc, depth * 2.0 - 1.0, 1.0);
  viewPosition /= max(abs(viewPosition.w), 1e-5);
  return (uCameraWorldMatrix * vec4(viewPosition.xyz, 1.0)).xyz;
}

bool isForegroundGeometry(vec2 uv, float depth) {
  if (depth >= 0.999999) return false;
  vec3 worldPosition = reconstructWorldPosition(uv, depth);
  float sceneDistance = length(worldPosition - uCameraPosition);
  float blackHoleDistance = length(uBlackHoleWorldPosition - uCameraPosition);
  return sceneDistance < blackHoleDistance - uHorizonRadius * 0.08;
}

vec3 platinumPalette(float heat, float frequencyShift) {
  vec3 paleGold = vec3(1.28, 0.91, 0.48);
  vec3 champagne = vec3(1.46, 1.22, 0.84);
  vec3 platinum = vec3(1.62, 1.53, 1.34);
  vec3 copper = vec3(1.42, 0.2, 0.025);
  vec3 color = mix(paleGold, champagne, smoothstep(0.12, 0.62, heat));
  color = mix(color, platinum, smoothstep(0.54, 0.96, heat * frequencyShift));
  float receding = 1.0 - smoothstep(0.76, 1.02, frequencyShift);
  return mix(color, copper, receding * 0.36);
}

vec3 diskEmission(
  vec3 samplePosition,
  vec3 rayDirection,
  vec3 diskNormal,
  vec3 axisA,
  vec3 axisB,
  out float opacity
) {
  float planeDistance = dot(samplePosition, diskNormal);
  vec3 radialVector = samplePosition - diskNormal * planeDistance;
  float radius = length(radialVector);
  vec3 radialDirection = radialVector / max(radius, 1e-4);
  float angle = atan(dot(radialDirection, axisB), dot(radialDirection, axisA));
  vec3 orbitalTangent = normalize(cross(diskNormal, radialDirection));

  float orbitalSpeed = clamp(sqrt(0.52 / max(radius - 0.82, 0.24)) * 0.72, 0.0, 0.78);
  float lineOfSight = dot(orbitalTangent, -rayDirection);
  float gamma = inversesqrt(max(1.0 - orbitalSpeed * orbitalSpeed, 0.18));
  float doppler = 1.0 / max(gamma * (1.0 - orbitalSpeed * lineOfSight), 0.34);
  float gravitationalShift = sqrt(max(1.0 - 1.0 / max(radius, 1.02), 0.0));
  float frequencyShift = clamp(doppler * gravitationalShift, 0.76, 1.34);

  float heat = 1.0 - smoothstep(
    ${(WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS + 0.1).toFixed(2)},
    ${(WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS - 0.15).toFixed(2)},
    radius
  );
  float angularVelocity = 0.21 + 1.48 / pow(max(radius, 1.0), 1.42);
  float phase = angle - uTime * angularVelocity * uSpin;
  vec2 flow = vec2(
    phase * 3.7 - radius * 0.48,
    radius * 3.15 + sin(phase * 2.0) * 0.38
  );
  float broad = fbm(flow * vec2(0.72, 1.0));
  float filaments = ridgedFbm(flow * vec2(3.9, 1.28) + broad * 4.8);
  float microFilaments = ridgedFbm(flow * vec2(10.8, 2.1) - broad * 6.2);
  float spiralShear = pow(0.5 + 0.5 * sin(phase * 7.0 - radius * 8.8 + broad * 7.2), 4.6);
  float density = clamp(
    broad * 0.25 + filaments * 0.68 + microFilaments * 0.28 + spiralShear * 0.56,
    0.0,
    1.48
  );

  float edgeBreakup = fbm(vec2(angle * 3.2 + 13.7, radius * 1.7 - uTime * 0.03));
  float outerRadius = ${(WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS - 0.18).toFixed(2)}
    + (edgeBreakup - 0.5) * 0.16;
  float innerEdge = smoothstep(
    ${WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS},
    ${(WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS + 0.23).toFixed(2)},
    radius
  );
  float outerEdge = 1.0 - smoothstep(outerRadius - 0.24, outerRadius, radius);
  float normalizedRadius = smoothstep(
    ${WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS},
    ${WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS},
    radius
  );
  float scaleHeight = mix(
    ${WORLD_SPACE_BLACK_HOLE_DISK_INNER_SCALE_HEIGHT},
    ${WORLD_SPACE_BLACK_HOLE_DISK_OUTER_SCALE_HEIGHT},
    normalizedRadius
  );
  float verticalDensity = exp(-pow(planeDistance / scaleHeight, 2.0));
  opacity = innerEdge
    * outerEdge
    * verticalDensity
    * (0.78 + density * 0.24);

  vec3 color = platinumPalette(heat, frequencyShift);
  float beaming = mix(0.74, 1.42, smoothstep(0.76, 1.34, frequencyShift));
  float whiteThread = smoothstep(0.88, 1.42, density) * smoothstep(0.28, 0.94, heat);
  float azimuthalBreakup = fbm(vec2(
    phase * 1.72 + broad * 2.35,
    radius * 1.08 - uTime * 0.04
  ));
  float luminousTexture = mix(0.64, 1.36, smoothstep(0.18, 1.34, density))
    * mix(0.76, 1.16, azimuthalBreakup);
  float dustLane = fbm(flow * vec2(1.85, 0.46) + vec2(3.7, -9.2));
  float dustModulation = mix(0.72, 1.08, smoothstep(0.3, 0.76, dustLane));
  vec3 emission = color * luminousTexture * dustModulation * beaming * (1.22 + heat * 1.85);
  emission += vec3(1.62, 1.5, 1.28) * whiteThread * beaming * 0.62;
  return emission;
}

void main() {
  vec3 originalBackground = texture2D(uSpaceTexture, vUv).rgb;

  float sceneDepth = texture2D(uSpaceDepth, vUv).r;
  bool hasForegroundGeometry = isForegroundGeometry(vUv, sceneDepth);

  vec3 diskNormal = normalize(uDiskNormal);
  vec3 axisA;
  vec3 axisB;
  diskBasis(diskNormal, axisA, axisB);

  vec3 rayDirection = reconstructWorldRay(vUv);
  vec3 cameraLocal = (uCameraPosition - uBlackHoleWorldPosition) / uHorizonRadius;
  const float integrationRadius = ${WORLD_SPACE_BLACK_HOLE_INTEGRATION_RADIUS.toFixed(6)};
  float sphereProjection = dot(cameraLocal, rayDirection);
  float sphereDiscriminant = sphereProjection * sphereProjection
    - (dot(cameraLocal, cameraLocal) - integrationRadius * integrationRadius);
  if (sphereDiscriminant < 0.0) {
    gl_FragColor = vec4(originalBackground, 1.0);
    return;
  }
  float sphereEntry = -sphereProjection - sqrt(sphereDiscriminant);
  vec3 rayPosition = cameraLocal;
  if (sphereEntry > 0.0) rayPosition += rayDirection * sphereEntry;
  float escapeRadius = integrationRadius + 0.18;
  float minimumRadius = length(rayPosition);
  float diskAlpha = 0.0;
  vec3 diskColor = vec3(0.0);
  bool escaped = false;
  vec3 firstCentroid = vec3(0.0);
  vec3 secondCentroid = vec3(0.0);
  vec3 firstDirectionSum = vec3(0.0);
  vec3 secondDirectionSum = vec3(0.0);
  float firstWeight = 0.0;
  float secondWeight = 0.0;
  float firstOpticalDepth = 0.0;
  float secondOpticalDepth = 0.0;
  bool insideVolume = false;
  bool firstSegmentComplete = false;
  for (int stepIndex = 0; stepIndex < MAX_STEPS; stepIndex++) {
    float radius = length(rayPosition);
    minimumRadius = min(minimumRadius, radius);
    if (radius < 1.0) {
      break;
    }
    if (stepIndex > 10 && radius > escapeRadius && dot(rayPosition, rayDirection) > 0.0) {
      escaped = true;
      break;
    }

    float angularMomentum2 = dot(cross(rayPosition, rayDirection), cross(rayPosition, rayDirection));
    float stepLength = mix(0.01, 0.22, smoothstep(1.05, integrationRadius, radius));
    vec3 previousPosition = rayPosition;

    vec3 gravity = -1.72 * angularMomentum2 * rayPosition / max(pow(radius, 5.0), 1e-4);
    vec3 frameDragging = cross(diskNormal, rayPosition)
      * (uSpin * 0.13 / max(pow(radius, 4.0), 0.08));
    rayDirection = normalize(rayDirection + (gravity + frameDragging) * stepLength);
    rayPosition += rayDirection * stepLength;

    float previousPlaneDistance = dot(previousPosition, diskNormal);
    float currentPlaneDistance = dot(rayPosition, diskNormal);
    float planeDistanceDelta = previousPlaneDistance - currentPlaneDistance;
    float closestSegmentT = abs(planeDistanceDelta) > 1e-5
      ? clamp(previousPlaneDistance / planeDistanceDelta, 0.0, 1.0)
      : 0.5;
    vec3 volumeSample = mix(previousPosition, rayPosition, closestSegmentT);
    float planeDistance = dot(volumeSample, diskNormal);
    vec3 radialSample = volumeSample - diskNormal * planeDistance;
    float diskRadius = length(radialSample);
    float sampleWeight = 0.0;
    if (
      diskRadius >= ${(WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS - 0.12).toFixed(3)}
      && diskRadius <= ${(WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS + 0.12).toFixed(3)}
      && abs(planeDistance) <= 0.48
    ) {
      float normalizedRadius = smoothstep(
        ${WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS},
        ${WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS},
        diskRadius
      );
      float scaleHeight = mix(
        ${WORLD_SPACE_BLACK_HOLE_DISK_INNER_SCALE_HEIGHT},
        ${WORLD_SPACE_BLACK_HOLE_DISK_OUTER_SCALE_HEIGHT},
        normalizedRadius
      );
      float normalizedHeight = abs(planeDistance) / scaleHeight;
      float verticalDensity = 1.0 - smoothstep(0.0, 2.5, normalizedHeight);
      verticalDensity *= verticalDensity;
      float innerDensity = smoothstep(
        ${WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS},
        ${(WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS + 0.23).toFixed(2)},
        diskRadius
      );
      float outerDensity = 1.0 - smoothstep(
        ${(WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS - 0.24).toFixed(2)},
        ${WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS},
        diskRadius
      );
      sampleWeight = innerDensity * outerDensity * verticalDensity * stepLength;
    }

    if (sampleWeight > 1e-6) {
      if (firstSegmentComplete) {
        secondCentroid += volumeSample * sampleWeight;
        secondDirectionSum += rayDirection * sampleWeight;
        secondWeight += sampleWeight;
        secondOpticalDepth += sampleWeight * 3.25;
      } else {
        firstCentroid += volumeSample * sampleWeight;
        firstDirectionSum += rayDirection * sampleWeight;
        firstWeight += sampleWeight;
        firstOpticalDepth += sampleWeight * 3.25;
      }
      insideVolume = true;
    } else {
      if (insideVolume && firstWeight > 1e-5) firstSegmentComplete = true;
      insideVolume = false;
    }
  }
  float criticalLensing = exp(-pow((minimumRadius - 1.5) / 0.42, 2.0));
  float residenceGain = 1.0 + 0.24 * criticalLensing;
  vec3 firstColor = vec3(0.0);
  vec3 secondColor = vec3(0.0);
  float firstAlpha = 0.0;
  float secondAlpha = 0.0;
  if (firstWeight > 1e-5) {
    float firstMaterialDensity;
    vec3 firstEmission = diskEmission(
      firstCentroid / firstWeight,
      normalize(firstDirectionSum),
      diskNormal,
      axisA,
      axisB,
      firstMaterialDensity
    );
    firstAlpha = 1.0 - exp(-firstOpticalDepth);
    firstColor = firstEmission * firstAlpha * residenceGain;
  }
  if (secondWeight > 1e-5) {
    float secondMaterialDensity;
    vec3 secondEmission = diskEmission(
      secondCentroid / secondWeight,
      normalize(secondDirectionSum),
      diskNormal,
      axisA,
      axisB,
      secondMaterialDensity
    );
    secondAlpha = 1.0 - exp(-secondOpticalDepth);
    secondColor = secondEmission * secondAlpha * residenceGain;
  }
  diskColor = firstColor + (1.0 - firstAlpha) * secondColor;
  diskAlpha = firstAlpha + (1.0 - firstAlpha) * secondAlpha;


  vec3 incomingRadiance = originalBackground;
  float sourceVisibility = escaped ? 1.0 : 0.0;
  if (escaped) {
    vec3 farWorldPosition = uCameraPosition + rayDirection * 100.0;
    vec4 farClip = uViewProjectionMatrix * vec4(farWorldPosition, 1.0);
    if (farClip.w > 1e-4) {
      vec2 warpedUv = farClip.xy / farClip.w * 0.5 + 0.5;
      bool insideViewport = all(greaterThanEqual(warpedUv, vec2(0.001)))
        && all(lessThanEqual(warpedUv, vec2(0.999)));
      if (insideViewport) {
        vec3 warpedBackground = texture2D(uSpaceTexture, warpedUv).rgb;
        float warpedDepth = texture2D(uSpaceDepth, warpedUv).r;
        if (!isForegroundGeometry(warpedUv, warpedDepth)) {
          float uvDeflection = length(warpedUv - vUv);
          float resolvedDeflection = smoothstep(0.001, 0.012, uvDeflection);
          float unresolvedDeflection = smoothstep(0.08, 0.18, uvDeflection);
          float lensingProximity = 1.0 - smoothstep(
            ${(WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS + 0.08).toFixed(6)},
            ${WORLD_SPACE_BLACK_HOLE_INTEGRATION_RADIUS.toFixed(6)},
            minimumRadius
          );
          float lensingWeight = resolvedDeflection
            * (1.0 - unresolvedDeflection)
            * lensingProximity;
          incomingRadiance = mix(
            originalBackground,
            warpedBackground,
            lensingWeight
          );
        }
      }
    }
  }


  vec3 color = incomingRadiance * sourceVisibility * (1.0 - diskAlpha)
    + diskColor;
  if (hasForegroundGeometry) color = originalBackground;
  gl_FragColor = vec4(color, 1.0);
}
`

export interface WorldSpaceKerrBlackHoleUniforms {
  [uniform: string]: IUniform<unknown>
  uSpaceTexture: { value: Texture | null }
  uSpaceDepth: { value: Texture | null }
  uInverseProjectionMatrix: { value: Matrix4 }
  uCameraWorldMatrix: { value: Matrix4 }
  uViewProjectionMatrix: { value: Matrix4 }
  uCameraPosition: { value: Vector3 }
  uBlackHoleWorldPosition: { value: Vector3 }
  uDiskNormal: { value: Vector3 }
  uHorizonRadius: { value: number }
  uSpin: { value: number }
  uTime: { value: number }
}

export function createWorldSpaceKerrBlackHoleUniforms(): WorldSpaceKerrBlackHoleUniforms {
  return {
    uSpaceTexture: { value: null },
    uSpaceDepth: { value: null },
    uInverseProjectionMatrix: { value: new Matrix4() },
    uCameraWorldMatrix: { value: new Matrix4() },
    uViewProjectionMatrix: { value: new Matrix4() },
    uCameraPosition: { value: new Vector3() },
    uBlackHoleWorldPosition: { value: new Vector3() },
    uDiskNormal: { value: WORLD_SPACE_BLACK_HOLE_DISK_NORMAL.clone() },
    uHorizonRadius: { value: WORLD_SPACE_BLACK_HOLE_HORIZON_RADIUS },
    uSpin: { value: 0.92 },
    uTime: { value: 0 },
  }
}
