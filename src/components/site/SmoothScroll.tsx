import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { setLenis, prefersReducedMotion } from "@/lib/scroll";

export function SmoothScroll() {
  let pathname = "/";
  try {
    const loc = useLocation();
    pathname = loc.pathname;
  } catch {
    if (typeof window !== "undefined") {
      pathname = window.location.pathname;
    }
  }

  const isAdmin = pathname.startsWith("/admin");
  const lenisRef = useRef<import("lenis").default | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || prefersReducedMotion()) return;
    if (typeof process !== "undefined" && process.env && process.env["NODE_ENV"] === "test") return;

    if (isAdmin) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        setLenis(null);
      }
      return;
    }

    if (!lenisRef.current) {
      import("lenis")
        .then(({ default: Lenis }) => {
          if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return;

          const instance = new Lenis({
            autoRaf: true,
            anchors: true,
            // Pure lerp damping for Mac/desktop without fixed duration or easing override.
            // This prevents rapid wheel/trackpad micro-deltas from resetting the animation curve.
            lerp: 0.08,
            smoothWheel: true,
            wheelMultiplier: 1.0,
            // Native hardware touch scrolling on phones for 100% stutter-free 60/120Hz touch
            syncTouch: false,
            touchMultiplier: 1.0,
            infinite: false,
            overscroll: false,
          });

          lenisRef.current = instance;
          setLenis(instance);
        })
        .catch(() => {});
    }

    return () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        setLenis(null);
      }
    };
  }, [isAdmin, pathname]);

  return null;
}
