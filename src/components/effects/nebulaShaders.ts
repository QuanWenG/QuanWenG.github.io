export const nebulaVertexShader = /* glsl */ `
varying vec3 vDirection;

void main() {
  vDirection = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const nebulaFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uScale;
uniform float uSeed;
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec3 vDirection;

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i), hash31(i + vec3(1, 0, 0)), f.x),
        mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x),
        mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.54;
  for (int octave = 0; octave < 5; octave++) {
    value += noise3(p) * amplitude;
    p = p * 2.03 + vec3(7.1, 3.7, 11.3);
    amplitude *= 0.48;
  }
  return value;
}

void main() {
  vec3 direction = normalize(vDirection);
  vec3 p = direction * uScale + vec3(uSeed, uSeed * 0.37, uTime);
  vec3 warp = vec3(
    fbm(p + vec3(0.0, 7.2, 1.3)),
    fbm(p + vec3(5.4, 0.0, 9.1)),
    fbm(p + vec3(8.7, 3.6, 0.0))
  );
  float broad = fbm(p + (warp - 0.5) * 1.8);
  float detail = fbm(p * 2.4 - (warp - 0.5));
  float dust = smoothstep(0.42, 0.76, fbm(p * 0.82 + 17.0));
  float filament = smoothstep(0.48, 0.8, broad * 0.72 + detail * 0.38);
  float latitude = pow(1.0 - abs(direction.y), 1.8);
  float density = filament * (0.34 + latitude * 0.66) * (1.0 - dust * 0.68);

  vec3 color = mix(uColorA, uColorB, smoothstep(0.25, 0.82, detail));
  color *= 0.42 + broad * 0.92;
  color += vec3(0.22, 0.3, 0.38) * pow(max(detail - 0.7, 0.0), 2.0);
  gl_FragColor = vec4(color, density * uOpacity);
}
`
