import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import portraitUrl from "@/assets/akshay-portrait.webp";
import { basicVertex, portraitFragment } from "./shaders";

import { PORTRAIT_ASPECT, PORTRAIT_BOTTOM, PORTRAIT_MAX_H, PORTRAIT_MAX_W, PORTRAIT_X } from "./layout";

// Prevent React Three Fiber from treating devtools source inspection attributes (e.g. data-tsd-source)
// as pierced nested paths (which would look for object.data["tsd-source"] and crash/retry on other devices).
if (typeof window !== "undefined") {
  const devtoolsProps = ["data-tsd-source", "data-source", "data-lov-id", "data-component"];
  for (const prop of devtoolsProps) {
    if (!(prop in Object.prototype)) {
      Object.defineProperty(Object.prototype, prop, {
        value: "",
        writable: true,
        configurable: true,
      });
    }
  }
}

const INTRO_SECONDS = 0.85;

// Global persistent state so the portrait entrance animation only plays once per session
// and never re-animates or refreshes when returning to Home on any device.
let hasHeroIntroPlayed = false;

// Preload the WebGL texture in Three.js cache immediately
if (typeof window !== "undefined") {
  useLoader.preload(THREE.TextureLoader, portraitUrl);
}

const pointer = { x: 0, y: 0 };
const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 4);

type SceneProps = { reduced: boolean; onReady: () => void };

function useLayout() {
  const { camera, viewport } = useThree();
  const vp = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, 0));
  const h = Math.min(vp.height * PORTRAIT_MAX_H, (vp.width * PORTRAIT_MAX_W) / PORTRAIT_ASPECT);
  const w = h * PORTRAIT_ASPECT;
  const cy = -vp.height / 2 + vp.height * PORTRAIT_BOTTOM + h / 2;
  const cx = vp.width * PORTRAIT_X;
  return { vp, w, h, cy, cx };
}

function Portrait({ intro, reduced }: { intro: { current: number }; reduced: boolean }) {
  const tex = useLoader(THREE.TextureLoader, portraitUrl);
  const { w, h, cy, cx } = useLayout();
  const group = useRef<THREE.Group>(null);
  const material = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return new THREE.ShaderMaterial({
      vertexShader: basicVertex,
      fragmentShader: portraitFragment,
      transparent: true,
      toneMapped: false,
      uniforms: {
        uMap: { value: tex },
        uOpacity: { value: 0 },
      },
    });
  }, [tex]);
  useEffect(() => () => material.dispose(), [material]);
  const uniforms = material.uniforms as unknown as Record<"uOpacity", { value: number }>;

  useFrame((state) => {
    uniforms.uOpacity.value = 1;
    if (!group.current) return;
    const breathe = reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.6) * 0.008;
    group.current.rotation.y = pointer.x * 0.035;
    group.current.rotation.x = pointer.y * -0.02;
    group.current.position.z = 0;
    group.current.position.y = cy + breathe * h;
    group.current.scale.set(1, 1, 1);
  });

  return (
    <group ref={group} position={[cx, cy, 0]}>
      <mesh renderOrder={1} material={material}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}

function Rig({ intro, reduced, onReady }: SceneProps & { intro: { current: number } }) {
  const ready = useRef(false);
  const start = useRef<number | null>(null);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    // Wall-clock based so the entrance finishes on time even on slow devices.
    if (reduced || hasHeroIntroPlayed) {
      intro.current = 1;
      hasHeroIntroPlayed = true;
    } else {
      if (start.current === null) start.current = state.clock.elapsedTime;
      intro.current = Math.min((state.clock.elapsedTime - start.current) / INTRO_SECONDS, 1);
      if (intro.current >= 1) {
        hasHeroIntroPlayed = true;
      }
    }
    void dt;
    // Camera parallax gives every depth layer its own motion.
    const cam = state.camera;
    cam.position.x += (pointer.x * 0.45 - cam.position.x) * 0.04;
    cam.position.y += (pointer.y * 0.25 - cam.position.y) * 0.04;
    cam.lookAt(0, 0, 0);
    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(onReady);
    }
  });
  return null;
}

function Scene({ reduced, onReady }: SceneProps) {
  const intro = useRef(reduced || hasHeroIntroPlayed ? 1 : 0);
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={0.5} position={[0, 0, 9]} scale={[30, 30, 1]} />
        <Lightformer intensity={0.35} position={[0, 0, -9]} rotation-y={Math.PI} scale={[30, 30, 1]} />
        <Lightformer intensity={2.2} position={[0, 6, -2]} rotation-x={Math.PI / 2} scale={[12, 3, 1]} />
        <Lightformer intensity={2.2} color="#8B2BFF" position={[-6, 0, 1]} rotation-y={Math.PI / 2} scale={[6, 10, 1]} />
        <Lightformer intensity={2} color="#00E5F2" position={[6, 0.5, 0]} rotation-y={-Math.PI / 2} scale={[6, 10, 1]} />
        <Lightformer intensity={3} position={[0, 1, 6]} scale={[10, 0.6, 1]} />
        <Lightformer intensity={2} position={[-3, 2.5, 4]} rotation-y={0.6} scale={[0.4, 6, 1]} />
        <Lightformer intensity={2} position={[3.5, -1, 4]} rotation-y={-0.6} scale={[0.4, 6, 1]} />
        <Lightformer intensity={1.2} color="#B45CFF" position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[10, 4, 1]} />
      </Environment>
      <directionalLight position={[-4, 2, 3]} intensity={2.2} color="#9b4dff" />
      <directionalLight position={[4, 1, 2]} intensity={2} color="#22e8f5" />

      <Suspense fallback={null}>
        <Portrait intro={intro} reduced={reduced} />
        <Rig intro={intro} reduced={reduced} onReady={onReady} />
      </Suspense>
    </>
  );
}

export default function HeroScene({
  active,
  reduced,
  onReady,
}: {
  active: boolean;
  reduced: boolean;
  onReady: () => void;
}) {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    if (!reduced) window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 10], fov: 32, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <Scene reduced={reduced} onReady={onReady} />
    </Canvas>
  );
}
