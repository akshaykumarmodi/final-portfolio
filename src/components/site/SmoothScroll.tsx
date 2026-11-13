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
            lerp: 0.1,
            smoothWheel: true,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.0,
            infinite: false,
            orientation: "vertical",
            gestureOrientation: "vertical",
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
