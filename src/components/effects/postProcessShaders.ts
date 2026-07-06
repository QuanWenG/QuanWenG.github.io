import { Vector2 } from 'three'

export const cinematicFinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uExposure: { value: 0.95 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uExposure;
    varying vec2 vUv;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    vec3 aces(vec3 color) {
      const float a = 2.51;
      const float b = 0.03;
      const float c = 2.43;
      const float d = 0.59;
      const float e = 0.14;
      return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float edge = smoothstep(0.16, 0.72, length(centered));
      vec2 aberration = normalize(centered + 1e-5) * edge / max(uResolution.x, uResolution.y) * 0.72;
      vec3 base = texture2D(tDiffuse, vUv).rgb;
      float highlights = smoothstep(0.72, 2.2, max(max(base.r, base.g), base.b));
      base.r = mix(base.r, texture2D(tDiffuse, vUv + aberration).r, highlights * 0.28);
      base.b = mix(base.b, texture2D(tDiffuse, vUv - aberration).b, highlights * 0.28);
      float luminance = dot(base, vec3(0.2126, 0.7152, 0.0722));
      base = mix(vec3(luminance), base, 1.08);
      base = aces(base * uExposure);
      base *= 1.0 - edge * 0.22;
      float grain = hash21(vUv * uResolution + fract(uTime) * 137.0) - 0.5;
      base += grain * 0.012 * (0.35 + edge * 0.65);

      gl_FragColor = vec4(base, 1.0);
    }
  `,
}
