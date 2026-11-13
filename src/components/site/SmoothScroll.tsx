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

          const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
          const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

          const instance = new Lenis({
            autoRaf: true,
            anchors: true,
            // lerp-based smooth scroll for desktop/Mac — adapts to scroll velocity
            // for ultra-silky trackpad & mouse wheel feel on Mac/laptop
            lerp: 0.09,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            // Higher multiplier = scroll covers more distance per wheel tick — feels snappier on Mac
            wheelMultiplier: isMobile ? 1.0 : 1.2,
            // syncTouch lets Lenis follow native touch momentum — smooth & natural on phones
            syncTouch: isTouch,
            // syncTouchLerp: how fast Lenis catches up to native touch position (lower = silkier)
            syncTouchLerp: 0.08,
            // Higher inertia = more momentum after lifting finger (feels native)
            touchInertiaExponent: 2,
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
