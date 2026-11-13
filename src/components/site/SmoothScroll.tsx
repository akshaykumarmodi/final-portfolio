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
            duration: 0.9,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1.15,
            touchMultiplier: 1.5,
            infinite: false,
          });

          lenisRef.current = instance;
          setLenis(instance);

          instance.on("scroll", () => {
            import("@/lib/sound").then(({ sound }) => sound.unlock()).catch(() => {});
          });
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
