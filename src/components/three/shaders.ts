/** GLSL shared by the 3D scenes. Kept tiny so every pixel stays cheap. */

export const noiseGLSL = /* glsl */ `
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = m * p; a *= 0.5; }
  return v;
}
`;

export const basicVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Volumetric-looking fog: domain-warped fbm (Inigo Quilez style), violet on the left,
 * teal on the right, drifting right and upward, breathing in scale.
 */
export const fogFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uViolet;
uniform vec3 uTeal;
uniform float uOpacity;
uniform float uScale;
uniform float uSeed;
uniform float uSpeed;
uniform float uBottom;
uniform vec2 uOffset;
varying vec2 vUv;
${noiseGLSL}
void main(){
  vec2 uv = vUv;
  float t = uTime * uSpeed;
  float breathe = 1.0 + 0.09 * sin(t * 0.21 + uSeed);
  vec2 p = (uv - 0.5) * uScale * breathe + uOffset + vec2(uSeed, uSeed * 0.7);
  p += vec2(-t * 0.045, -t * 0.03);

  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.05)), fbm(p + vec2(5.2, 1.3) - t * 0.04));
  vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 0.07),
                fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * 0.06));
  float f = fbm(p + 2.4 * r);

  float density = smoothstep(0.28, 0.92, f * f * 1.9 + length(q) * 0.22);
  float wisps = pow(clamp(f * 1.25, 0.0, 1.0), 4.0);

  float side = smoothstep(0.28, 0.78, uv.x + (r.x - 0.5) * 0.45);
  vec3 col = mix(uViolet, uTeal, side);
  col += mix(uViolet, vec3(0.8, 0.85, 1.0), 0.5) * wisps * 0.9;

  float mask = smoothstep(0.0, 0.28, uv.x) * smoothstep(1.0, 0.72, uv.x)
             * smoothstep(0.0, 0.22, uv.y) * smoothstep(1.0, 0.55, uv.y);
  mask *= mix(1.0, smoothstep(0.75, 0.05, uv.y), uBottom);

  float a = clamp(density * mask * uOpacity, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`;

/** Portrait cut-out with natural colors and a soft bottom fade. */
export const portraitFragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uOpacity;
varying vec2 vUv;
void main(){
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.01) discard;
  float fade = smoothstep(0.0, 0.16, vUv.y);
  gl_FragColor = vec4(c.rgb, c.a * uOpacity * fade);
  #include <colorspace_fragment>
}
`;

/** Fresnel rim for bubbles and glass. */
export const fresnelVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const fresnelFragment = /* glsl */ `
uniform vec3 uViolet;
uniform vec3 uTeal;
uniform float uPower;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  float f = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), uPower);
  vec3 col = mix(uViolet, uTeal, smoothstep(-0.6, 0.6, vNormal.x + vNormal.y * 0.3));
  gl_FragColor = vec4(col * f * uIntensity, f);
  #include <colorspace_fragment>
}
`;
