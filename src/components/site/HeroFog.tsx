import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/scroll";

const VERTEX_SHADER = /* glsl */ `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uSpeedFactor;

varying vec2 vUv;

// Hash & 2D Value Noise
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// 5-Octave FBM with rotation
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = rot * p;
    a *= 0.5;
  }
  return v;
}

// Color palette for cinematic smoke - rich, deep tones for atmospheric depth
const vec3 C_DEEP_VIOLET     = vec3(0.18, 0.03, 0.34); // deep violet base
const vec3 C_ELECTRIC_PURPLE = vec3(0.46, 0.14, 0.80); // electric purple highlights
const vec3 C_LAVENDER_EDGE   = vec3(0.58, 0.32, 0.84); // soft lavender edges
const vec3 C_CENTER_ATMOS    = vec3(0.18, 0.20, 0.48); // subtle purple-blue atmospheric blend
const vec3 C_CYAN            = vec3(0.02, 0.58, 0.74); // cyan
const vec3 C_TURQUOISE       = vec3(0.06, 0.80, 0.86); // soft turquoise highlights
const vec3 C_TEAL            = vec3(0.00, 0.76, 0.80); // teal smoke
const vec3 C_BLUE_DEPTH      = vec3(0.12, 0.38, 0.80); // electric blue depth
const vec3 C_WISP_SPEC       = vec3(0.75, 0.80, 0.90); // delicate specular highlights

// Computes an organic rising smoke plume with continuous upward advection
float computeRisingPlume(
  vec2 uv,
  float xCenter,
  float spread,
  float time,
  float speed,
  float curlScale,
  vec2 mouse
) {
  float y = uv.y;

  // Gentle, slow lateral snaking as smoke curls upward
  float sway = sin(y * 3.4 + time * 0.28 + xCenter * 9.0) * 0.048;
  float dx = abs(uv.x - xCenter - sway);

  // Plume expands naturally as it rises into the atmosphere
  float plumeWidth = spread * (0.85 + y * 1.35);
  float horizShape = smoothstep(plumeWidth, plumeWidth * 0.18, dx);
  if (horizShape < 0.005) return 0.0;

  // Steady, continuous upward coordinate advection at slow, gentle speed
  vec2 coord = vec2((uv.x - xCenter) * 2.6, (y - time * speed) * 1.6) + mouse * 0.12;

  // 2-step domain-warping for physical smoke curl and twisting wisps
  vec2 q = vec2(
    fbm(coord * curlScale + vec2(0.0, -time * speed * 0.65)),
    fbm(coord * curlScale + vec2(5.2, 1.3) - vec2(0.0, time * speed * 0.55))
  );
  vec2 r = vec2(
    fbm(coord * curlScale * 1.4 + 2.5 * q + vec2(1.7, 9.2) - vec2(0.0, time * speed * 0.45)),
    fbm(coord * curlScale * 1.4 + 2.5 * q + vec2(8.3, 2.8) - vec2(0.0, time * speed * 0.40))
  );

  float n = fbm(coord * curlScale * 1.8 + 2.2 * r);

  // Wispy organic density
  float density = smoothstep(0.28, 0.80, n * 1.25 + length(q) * 0.22);
  float wisps = pow(clamp(n * 1.2, 0.0, 1.0), 3.4) * 0.28;

  // Vertical life-cycle:
  // 1. Originates near the lower landscape (emerges smoothly from bottom)
  // 2. Becomes more transparent as it rises, gently dissolving into the dark atmosphere
  float bottomEmergence = smoothstep(0.01, 0.13, y);
  float topDissolve = pow(clamp(1.0 - y * 0.82, 0.0, 1.0), 1.3);

  return (density + wisps) * horizShape * bottomEmergence * topDissolve;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);

  // Constant, steady timeline with slow, gentle speed factor
  float t = (uTime + 65.0) * uSpeedFactor;
  vec2 m = uMouse * 0.03;

  // -------------------------------------------------------------------------
  // 1. LEFT RISING SMOKE: Deep violet smoke, electric purple, soft lavender edges
  // Full left coverage with 3 plumes for a continuous, beautifully blended presence
  // -------------------------------------------------------------------------
  float leftSmoke1 = computeRisingPlume(uv, 0.07, 0.32, t, 0.044, 1.25, m);
  float leftSmoke2 = computeRisingPlume(uv, 0.20, 0.30, t, 0.040, 1.30, m);
  float leftSmoke3 = computeRisingPlume(uv, 0.35, 0.30, t, 0.038, 1.22, m);
  float leftTotal = clamp(leftSmoke1 * 0.88 + leftSmoke2 * 0.84 + leftSmoke3 * 0.60, 0.0, 1.0);

  vec3 leftColor = mix(C_DEEP_VIOLET * 1.15, C_ELECTRIC_PURPLE, smoothstep(0.12, 0.70, leftTotal));
  leftColor = mix(leftColor, C_LAVENDER_EDGE, pow(clamp(leftTotal * 1.1, 0.0, 1.0), 2.6) * 0.35);

  // -------------------------------------------------------------------------
  // 2. CENTER RISING SMOKE: Subtle purple-blue atmospheric blend, thin translucent vapor
  // -------------------------------------------------------------------------
  float centerSmoke = computeRisingPlume(uv, 0.50, 0.34, t, 0.038, 1.20, m) * 0.52;
  vec3 centerColor = C_CENTER_ATMOS;

  // -------------------------------------------------------------------------
  // 3. RIGHT RISING SMOKE: Teal and cyan smoke, soft turquoise highlights
  // -------------------------------------------------------------------------
  float rightSmoke1 = computeRisingPlume(uv, 0.70, 0.30, t, 0.042, 1.30, m);
  float rightSmoke2 = computeRisingPlume(uv, 0.88, 0.28, t, 0.048, 1.25, m);
  float rightTotal = clamp(rightSmoke1 * 0.88 + rightSmoke2 * 0.92, 0.0, 1.0);

  vec3 rightColor = mix(C_CYAN, C_TEAL, smoothstep(0.12, 0.70, rightTotal));
  rightColor = mix(rightColor, C_TURQUOISE, pow(clamp(rightTotal * 1.1, 0.0, 1.0), 2.6) * 0.40);
  rightColor = mix(rightColor, C_BLUE_DEPTH, clamp(rightSmoke2 * 0.5, 0.0, 1.0));

  // -------------------------------------------------------------------------
  // 4. LOW-LYING HORIZON VAPOR BED (feeds into rising plumes from landscape)
  // -------------------------------------------------------------------------
  float groundBed = smoothstep(0.30, 0.03, uv.y) * smoothstep(0.01, 0.08, uv.y);
  float groundNoise = fbm(vec2(p.x * 2.2, uv.y * 3.6 - t * 0.028) + m * 0.25);
  float groundSmoke = smoothstep(0.24, 0.78, groundNoise) * groundBed * 0.38;
  vec3 groundColor = mix(C_ELECTRIC_PURPLE * 0.6, C_TEAL * 0.7, smoothstep(0.2, 0.8, uv.x));

  // -------------------------------------------------------------------------
  // 5. SEAMLESS COLOR BLENDING & MULTI-STREAM COMPOSITION
  // Weighted normalization allows overlapping smoke plumes to blend physically
  // -------------------------------------------------------------------------
  float totalSmoke = leftTotal + centerSmoke + rightTotal + groundSmoke + 0.0001;
  vec3 smokeRgb = (leftColor * leftTotal
                + centerColor * centerSmoke
                + rightColor * rightTotal
                + groundColor * groundSmoke) / totalSmoke;
  smokeRgb *= min(totalSmoke, 1.18);

  // Specular wisps along fine edges - kept subtle and delicate
  smokeRgb += C_WISP_SPEC * pow(clamp(totalSmoke * 0.45, 0.0, 1.0), 3.8) * 0.16;

  // Smooth edge falloff extending seamlessly to full viewport boundaries horizontally
  // Vertically, continuous smoke flows naturally without clipping at section boundaries
  float edgeFalloff = smoothstep(-0.04, 0.04, uv.x) * smoothstep(1.04, 0.96, uv.x);

  // Balanced opacity with rich left and right plumes and gentle atmospheric depth
  float rawAlpha = (leftTotal * 0.65 + centerSmoke * 0.46 + rightTotal * 0.66 + groundSmoke * 0.40) * edgeFalloff;
  float finalAlpha = clamp(rawAlpha, 0.0, 0.62);

  // Clean premultiplied alpha output
  gl_FragColor = vec4(smokeRgb * finalAlpha, finalAlpha);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function HeroFog() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl =
      canvas.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      }) ||
      (canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
      }) as WebGLRenderingContext | null);

    if (!gl) return;

    const vert = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const frag = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry covering NDC [-1, 1]
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(program, "uTime");
    const uResolutionLoc = gl.getUniformLocation(program, "uResolution");
    const uMouseLoc = gl.getUniformLocation(program, "uMouse");
    const uSpeedFactorLoc = gl.getUniformLocation(program, "uSpeedFactor");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const reduced = prefersReducedMotion();
    gl.uniform1f(uSpeedFactorLoc, reduced ? 0.10 : 0.40);

    // Mouse tracking with smooth damping
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onPointerMove = (e: PointerEvent) => {
      targetX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      targetY = -((e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
    };

    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    let rafId = 0;
    let isVisible = true;
    const startTime = performance.now();

    const render = (now: number) => {
      if (!isVisible) {
        rafId = 0;
        return;
      }

      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;

      const elapsed = (now - startTime) * 0.001;

      gl.useProgram(program);
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform2f(uMouseLoc, currentX, currentY);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    };

    const updateSize = (rectW?: number, rectH?: number) => {
      const containerW = rectW || container.clientWidth || window.innerWidth || 1280;
      const containerH = rectH || container.clientHeight || window.innerHeight || 720;
      // Cap render buffer dimension to max 640px for rock-solid 60/120fps GPU frame pacing across section transitions
      const scale = Math.min(1, 640 / Math.max(containerW, 1));
      const w = Math.max(Math.floor(containerW * scale), 1);
      const h = Math.max(Math.floor(containerH * scale), 1);

      if (Math.abs(canvas.width - w) > 4 || Math.abs(canvas.height - h) > 4) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uResolutionLoc, w, h);
        render(performance.now());
      }
    };

    updateSize();

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          updateSize(width, height);
        }
      }
    });
    ro.observe(container);

    // Pause rendering when offscreen with a tight 30px margin to avoid competing dual-shader GPU stalls
    const io = new IntersectionObserver(
      ([entry]) => {
        const nextVisible = entry ? entry.isIntersecting : true;
        if (nextVisible && !isVisible) {
          isVisible = true;
          if (!rafId) {
            rafId = requestAnimationFrame(render);
          }
        } else if (!nextVisible && isVisible) {
          isVisible = false;
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      { threshold: 0, rootMargin: "30px 0px" },
    );
    io.observe(container);

    // Draw FRAME 0 IMMEDIATELY with balanced rising smoke
    render(performance.now());

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      if (!reduced) {
        window.removeEventListener("pointermove", onPointerMove);
      }
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-hidden"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
